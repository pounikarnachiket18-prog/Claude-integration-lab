// =====================================================================================
// DAILY BRIEF: PIB, RBI, current affairs and world news in one iPad / iPhone app.
//
// How to use: in Swift Playgrounds on iPad, create a new App, open ContentView.swift,
// replace everything with this file, and tap Run (▶). Details in README.md.
//
// Tabs:  PIB · RBI · Current Affairs · World · Saved
// Each tab reads several RSS news feeds at once, merges them, removes duplicates and
// sorts newest first. Pull down to refresh, search, filter to "Today",
// tap a story to read it, swipe left to save it.
// =====================================================================================

import SwiftUI
import SafariServices

// MARK: - News sources (edit these lists to add or remove feeds)

struct FeedSource: Hashable, Identifiable {
    let name: String
    let url: String
    var id: String { url }
}

/// Google News search as a feed: reliable backup coverage for any topic.
func googleNews(_ query: String) -> String {
    let q = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
    return "https://news.google.com/rss/search?q=\(q)&hl=en-IN&gl=IN&ceid=IN:en"
}

enum NewsSection: String, CaseIterable, Identifiable {
    case pib, rbi, india, world
    var id: String { rawValue }

    var title: String {
        switch self {
        case .pib: return "PIB"
        case .rbi: return "RBI"
        case .india: return "Current Affairs"
        case .world: return "World"
        }
    }

    var icon: String {
        switch self {
        case .pib: return "building.columns"
        case .rbi: return "indianrupeesign.circle"
        case .india: return "newspaper"
        case .world: return "globe.asia.australia"
        }
    }

    var sources: [FeedSource] {
        switch self {
        case .pib:
            return [
                FeedSource(name: "PIB Press Releases", url: "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3"),
                FeedSource(name: "PIB in the News", url: googleNews("\"Press Information Bureau\" OR PIB when:2d")),
            ]
        case .rbi:
            return [
                FeedSource(name: "RBI Press Releases", url: "https://rbi.org.in/pressreleases_rss.xml"),
                FeedSource(name: "RBI Notifications", url: "https://rbi.org.in/notifications_rss.xml"),
                FeedSource(name: "RBI Speeches", url: "https://www.rbi.org.in/speeches_rss.xml"),
                FeedSource(name: "RBI in the News", url: googleNews("\"Reserve Bank of India\" OR RBI when:2d")),
            ]
        case .india:
            return [
                FeedSource(name: "Top Stories India", url: "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en"),
                FeedSource(name: "The Hindu: National", url: "https://www.thehindu.com/news/national/feeder/default.rss"),
                FeedSource(name: "Business & Economy", url: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en"),
                FeedSource(name: "Govt Schemes & Policy", url: googleNews("India government scheme OR policy OR cabinet when:2d")),
            ]
        case .world:
            return [
                FeedSource(name: "World Headlines", url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-IN&gl=IN&ceid=IN:en"),
                FeedSource(name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml"),
                FeedSource(name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml"),
                FeedSource(name: "Science & Tech", url: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-IN&gl=IN&ceid=IN:en"),
            ]
        }
    }
}

// MARK: - Article

struct Article: Identifiable, Hashable, Codable {
    let title: String
    let link: String
    let source: String
    let publisher: String?
    let date: Date?
    let summary: String
    var id: String { link.isEmpty ? title : link }
}

// MARK: - Reading RSS / Atom feeds

final class FeedParser: NSObject, XMLParserDelegate {
    private let sourceName: String
    private var items: [Article] = []
    private var current: [String: String]?
    private var text = ""

    init(sourceName: String) { self.sourceName = sourceName }

    func parse(_ data: Data) -> [Article] {
        let parser = XMLParser(data: data)
        parser.delegate = self
        parser.parse()
        return items
    }

    func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?,
                qualifiedName qName: String?, attributes attributeDict: [String: String] = [:]) {
        let name = elementName.lowercased()
        if name == "item" || name == "entry" { current = [:] }
        // Atom feeds put the link in an attribute: <link href="..."/>
        if current != nil, name == "link", let href = attributeDict["href"], current?["link"] == nil {
            current?["link"] = href
        }
        text = ""
    }

    func parser(_ parser: XMLParser, foundCharacters string: String) { text += string }

    func parser(_ parser: XMLParser, foundCDATA CDATABlock: Data) {
        if let s = String(data: CDATABlock, encoding: .utf8) { text += s }
    }

    func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?,
                qualifiedName qName: String?) {
        let name = elementName.lowercased()
        guard current != nil else { return }
        let value = text.trimmingCharacters(in: .whitespacesAndNewlines)
        switch name {
        case "title":
            if current?["title"] == nil { current?["title"] = value }
        case "link":
            if !value.isEmpty, current?["link"] == nil { current?["link"] = value }
        case "pubdate", "published", "updated", "dc:date":
            if current?["date"] == nil { current?["date"] = value }
        case "description", "summary", "content:encoded":
            if current?["summary"] == nil { current?["summary"] = value }
        case "source":
            current?["publisher"] = value
        case "item", "entry":
            if let c = current, let title = c["title"], !title.isEmpty {
                items.append(Article(
                    title: title.cleanedHTML,
                    link: c["link"] ?? "",
                    source: sourceName,
                    publisher: c["publisher"],
                    date: DateParser.parse(c["date"]),
                    summary: (c["summary"] ?? "").cleanedHTML
                ))
            }
            current = nil
        default:
            break
        }
        text = ""
    }
}

enum DateParser {
    private static let formats = [
        "EEE, dd MMM yyyy HH:mm:ss Z", "EEE, dd MMM yyyy HH:mm:ss zzz", "EEE, d MMM yyyy HH:mm:ss Z",
        "EEE, d MMM yyyy HH:mm:ss zzz", "EEE, dd MMM yyyy HH:mm Z", "dd MMM yyyy HH:mm:ss Z",
        "yyyy-MM-dd'T'HH:mm:ssZ", "yyyy-MM-dd'T'HH:mm:ss.SSSZ", "dd-MM-yyyy HH:mm:ss", "EEE, dd MMM yyyy",
    ]
    private static let formatters: [DateFormatter] = formats.map { format in
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "Asia/Kolkata")
        f.dateFormat = format
        return f
    }
    private static let iso = ISO8601DateFormatter()

    static func parse(_ string: String?) -> Date? {
        guard let s = string?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty else { return nil }
        if let d = iso.date(from: s) { return d }
        for f in formatters { if let d = f.date(from: s) { return d } }
        return nil
    }
}

extension String {
    /// Removes HTML tags and common HTML codes, and tidies up spaces.
    var cleanedHTML: String {
        var s = replacingOccurrences(of: "<[^>]+>", with: " ", options: .regularExpression)
        let codes = ["&nbsp;": " ", "&amp;": "&", "&quot;": "\"", "&#39;": "'", "&#039;": "'", "&lt;": "<",
                     "&gt;": ">", "&rsquo;": "’", "&lsquo;": "‘", "&ldquo;": "“", "&rdquo;": "”",
                     "&#8217;": "’", "&#8216;": "‘", "&#8220;": "“", "&#8221;": "”", "&hellip;": "…", "&ndash;": "–"]
        for (code, char) in codes { s = s.replacingOccurrences(of: code, with: char) }
        s = s.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        return s.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

enum FeedFetcher {
    static func fetch(_ source: FeedSource) async throws -> [Article] {
        guard let url = URL(string: source.url) else { throw URLError(.badURL) }
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 20)
        // Some government sites refuse requests that don't look like a browser
        request.setValue("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                         forHTTPHeaderField: "User-Agent")
        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw URLError(.badServerResponse)
        }
        let articles = FeedParser(sourceName: source.name).parse(data)
        if articles.isEmpty { throw URLError(.cannotParseResponse) }
        return articles
    }
}

// MARK: - Loading one tab

@MainActor
final class SectionModel: ObservableObject {
    let section: NewsSection
    @Published var articles: [Article] = []
    @Published var failedSources: [String] = []
    @Published var isLoading = false
    @Published var lastUpdated: Date?

    init(section: NewsSection) { self.section = section }

    func load() async {
        isLoading = true
        var collected: [Article] = []
        var failed: [String] = []
        // Fetch every source in this tab at the same time
        await withTaskGroup(of: (String, [Article]?).self) { group in
            for source in section.sources {
                group.addTask { (source.name, try? await FeedFetcher.fetch(source)) }
            }
            for await (name, result) in group {
                if let result = result { collected += result } else { failed.append(name) }
            }
        }
        // Remove duplicates (same headline from two feeds) and sort newest first
        var seen = Set<String>()
        articles = collected
            .filter { seen.insert($0.title.lowercased()).inserted }
            .sorted { ($0.date ?? .distantPast) > ($1.date ?? .distantPast) }
        failedSources = failed.sorted()
        lastUpdated = Date()
        isLoading = false
    }
}

// MARK: - Saved stories (kept on the device)

@MainActor
final class SavedStore: ObservableObject {
    @Published private(set) var items: [Article] = []
    private let key = "savedArticles"

    init() {
        if let data = UserDefaults.standard.data(forKey: key),
           let saved = try? JSONDecoder().decode([Article].self, from: data) {
            items = saved
        }
    }

    func isSaved(_ article: Article) -> Bool { items.contains { $0.id == article.id } }

    func toggle(_ article: Article) {
        if isSaved(article) {
            items.removeAll { $0.id == article.id }
        } else {
            items.insert(article, at: 0)
        }
        if let data = try? JSONEncoder().encode(items) { UserDefaults.standard.set(data, forKey: key) }
    }
}

// MARK: - Screens

struct ContentView: View {
    @StateObject private var saved = SavedStore()

    var body: some View {
        TabView {
            ForEach(NewsSection.allCases) { section in
                SectionScreen(section: section)
                    .tabItem { Label(section.title, systemImage: section.icon) }
            }
            SavedScreen()
                .tabItem { Label("Saved", systemImage: "bookmark") }
        }
        .environmentObject(saved)
        .tint(.orange)
    }
}

enum TimeFilter: String, CaseIterable, Identifiable {
    case all = "All", today = "Today"
    var id: String { rawValue }
}

struct SectionScreen: View {
    let section: NewsSection
    @StateObject private var model: SectionModel
    @State private var query = ""
    @State private var filter: TimeFilter = .all

    init(section: NewsSection) {
        self.section = section
        _model = StateObject(wrappedValue: SectionModel(section: section))
    }

    private var visible: [Article] {
        model.articles.filter { article in
            let matchesTime = filter == .all || (article.date.map { Calendar.current.isDateInToday($0) } ?? false)
            let matchesSearch = query.isEmpty
                || article.title.localizedCaseInsensitiveContains(query)
                || article.summary.localizedCaseInsensitiveContains(query)
            return matchesTime && matchesSearch
        }
    }

    var body: some View {
        NavigationStack {
            List {
                Picker("Show", selection: $filter) {
                    ForEach(TimeFilter.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .listRowSeparator(.hidden)

                if !model.failedSources.isEmpty {
                    Label("Couldn't load: \(model.failedSources.joined(separator: ", ")). Pull down to try again.",
                          systemImage: "exclamationmark.triangle")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                ForEach(visible) { article in
                    ArticleRow(article: article)
                }
            }
            .listStyle(.plain)
            .navigationTitle(section.title)
            .searchable(text: $query, prompt: "Search \(section.title)")
            .refreshable { await model.load() }
            .task { if model.articles.isEmpty { await model.load() } }
            .toolbar {
                if let updated = model.lastUpdated {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Text("Updated \(updated.formatted(date: .omitted, time: .shortened))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .overlay {
                if model.isLoading && model.articles.isEmpty {
                    ProgressView("Loading \(section.title)…")
                } else if !model.isLoading && visible.isEmpty {
                    EmptyMessage(icon: section.icon,
                                 title: filter == .today ? "Nothing yet today" : "No stories",
                                 message: "Pull down to refresh, or switch to All.")
                }
            }
        }
    }
}

struct SavedScreen: View {
    @EnvironmentObject private var saved: SavedStore

    var body: some View {
        NavigationStack {
            List {
                ForEach(saved.items) { article in
                    ArticleRow(article: article)
                }
            }
            .listStyle(.plain)
            .navigationTitle("Saved")
            .overlay {
                if saved.items.isEmpty {
                    EmptyMessage(icon: "bookmark", title: "No saved stories",
                                 message: "Swipe left on any story and tap Save.")
                }
            }
        }
    }
}

struct WebLink: Identifiable {
    let url: URL
    var id: String { url.absoluteString }
}

struct ArticleRow: View {
    let article: Article
    @EnvironmentObject private var saved: SavedStore
    @State private var web: WebLink?

    var body: some View {
        Button {
            if let url = URL(string: article.link) { web = WebLink(url: url) }
        } label: {
            VStack(alignment: .leading, spacing: 6) {
                Text(article.title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
                if !article.summary.isEmpty && !article.summary.hasPrefix(article.title) {
                    Text(article.summary)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)
                }
                HStack(spacing: 4) {
                    Text(article.publisher ?? article.source)
                    if let date = article.date {
                        Text("·")
                        Text(date, style: .relative) + Text(" ago")
                    }
                    Spacer()
                    if saved.isSaved(article) {
                        Image(systemName: "bookmark.fill").foregroundStyle(.orange)
                    }
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            .padding(.vertical, 4)
        }
        .swipeActions(edge: .trailing) {
            Button {
                saved.toggle(article)
            } label: {
                Label(saved.isSaved(article) ? "Unsave" : "Save", systemImage: "bookmark")
            }
            .tint(.orange)
        }
        .contextMenu {
            Button {
                saved.toggle(article)
            } label: {
                Label(saved.isSaved(article) ? "Remove from Saved" : "Save", systemImage: "bookmark")
            }
            if let url = URL(string: article.link) {
                ShareLink(item: url) { Label("Share", systemImage: "square.and.arrow.up") }
            }
        }
        .sheet(item: $web) { link in
            SafariView(url: link.url).ignoresSafeArea()
        }
    }
}

struct EmptyMessage: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon).font(.system(size: 44)).foregroundStyle(.secondary)
            Text(title).font(.headline)
            Text(message).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }
        .padding()
    }
}

/// Opens articles inside the app with Safari (reader mode, sharing, and so on).
struct SafariView: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController { SFSafariViewController(url: url) }
    func updateUIViewController(_ controller: SFSafariViewController, context: Context) {}
}
