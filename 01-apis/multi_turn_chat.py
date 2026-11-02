"""
multi_turn_chat.py: a chat with Claude that remembers earlier messages.

Key idea:
    The Claude API has no memory between calls. To have a conversation,
    YOU keep a list of every message and send the whole list each time.

How to run it (from the repo's top folder, with the virtual environment active):
    python 01-apis/multi_turn_chat.py           # real chat (needs ANTHROPIC_API_KEY, costs money)
    python 01-apis/multi_turn_chat.py --demo    # free practice mode, no API calls

Type "quit" to end the chat.
"""

import os
import sys

MODEL = "claude-haiku-5-5"
MAX_TOKENS = 300

# The "system prompt" sets Claude's behavior for the whole conversation.
# It's sent separately from the messages list, on every call.
SYSTEM_PROMPT = "You are a friendly tutor. Keep answers short and simple."


def ask_claude(client, history):
    """Send the WHOLE conversation so far to Claude and return its reply text."""
    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=history,  # every earlier message, not just the newest one
    )
    # Join the text from all text blocks in the reply.
    return "".join(block.text for block in response.content if block.type == "text")


def fake_reply(history):
    """Demo mode: pretend to be Claude, without calling the API (free)."""
    turns = len([m for m in history if m["role"] == "user"])
    return f"(demo reply #{turns}: I can see {len(history)} message(s) in the history)"


def main():
    demo = "--demo" in sys.argv

    # --- 1. Set up: real client, or demo mode --------------------------------
    client = None
    if not demo:
        if not os.environ.get("ANTHROPIC_API_KEY"):
            print("No API key found. Set ANTHROPIC_API_KEY, or run with --demo to practice for free.")
            sys.exit(1)
        import anthropic  # imported here so --demo works even without the package
        client = anthropic.Anthropic()

    # --- 2. The conversation history starts empty ---------------------------
    # This list IS the conversation's memory. We add to it every turn.
    history = []

    print("Chat started. Type 'quit' to stop." + ("  [DEMO MODE: no API calls]" if demo else ""))

    while True:
        # --- 3. Get the user's message --------------------------------------
        try:
            user_text = input("\nYou: ").strip()
        except EOFError:  # input ran out (e.g., piped text ended)
            break
        if user_text.lower() in ("quit", "exit"):
            break
        if not user_text:
            continue

        # --- 4. Add the user's message to the history -----------------------
        history.append({"role": "user", "content": user_text})

        # --- 5. Send the full history, get a reply --------------------------
        if demo:
            reply = fake_reply(history)
        else:
            try:
                reply = ask_claude(client, history)
            except Exception as error:  # keep the beginner version simple
                print(f"Error talking to Claude: {error}")
                history.pop()  # undo the user message so the history stays valid
                continue

        # --- 6. Add Claude's reply to the history too -----------------------
        # Without this, Claude would "forget" what it said last time.
        history.append({"role": "assistant", "content": reply})
        print(f"Claude: {reply}")

    # --- 7. Show what was actually sent: the history list -------------------
    print(f"\nChat ended. The history had {len(history)} messages:")
    for i, message in enumerate(history, start=1):
        print(f"  {i}. {message['role']:>9}: {message['content']}")


if __name__ == "__main__":
    main()
