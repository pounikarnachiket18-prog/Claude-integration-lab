"""
hello_claude.py: my first Claude API integration.

What it does:
    Sends one question to Claude and prints the answer.

How to run it (from the repo's top folder, with the virtual environment active):
    python 01-apis/hello_claude.py

Before a real call works, set your API key in your terminal (never in this file):
    export ANTHROPIC_API_KEY="your-key-here"      # Mac / Linux
    setx ANTHROPIC_API_KEY "your-key-here"        # Windows (then open a new terminal)
"""

# --- 1. Imports: bring in the tools we need ---------------------------------
import os    # Built into Python. Lets us read environment variables (like the API key).
import sys   # Built into Python. Lets us stop the program early with sys.exit().

import anthropic  # The package we installed in step 2. It knows how to talk to Claude.


# --- 2. Settings: things you might want to change ---------------------------
# Which Claude model to use. Haiku is the smallest, fastest and cheapest model,
# which makes it ideal for learning.
MODEL = "claude-haiku-5-5"

# The most "tokens" (pieces of words, roughly 3/4 of a word each) Claude may
# write back. A low limit keeps answers short and costs tiny.
MAX_TOKENS = 300

# The question we'll ask Claude.
QUESTION = "In two sentences, explain what an API is to a complete beginner."


def main():
    # --- 3. Safety check: is there an API key? ------------------------------
    # os.environ.get() looks for a setting named ANTHROPIC_API_KEY in the terminal.
    # If it isn't there, we get None. We never print the key itself.
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("No API key found.")
        print("Set the ANTHROPIC_API_KEY environment variable, then run this again.")
        print("(Nothing was sent to Claude, and nothing was charged.)")
        sys.exit(1)  # Stop here. 1 means "ended with a problem".

    # --- 4. Create the client -----------------------------------------------
    # The client is our "phone line" to Claude. It finds ANTHROPIC_API_KEY
    # by itself, so we never have to type the key in our code.
    client = anthropic.Anthropic()

    print(f"Asking Claude ({MODEL}): {QUESTION}\n")

    # --- 5. Send the message (this is the part that costs money) ------------
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            # "messages" is the conversation so far. Each message has a role
            # ("user" is you, "assistant" is Claude) and its content.
            messages=[
                {"role": "user", "content": QUESTION},
            ],
        )
    # If something goes wrong, show a friendly message instead of a scary crash.
    except anthropic.AuthenticationError:
        print("Your API key was rejected. Check that it's correct and still active.")
        sys.exit(1)
    except anthropic.APIConnectionError:
        print("Couldn't reach the Claude API. Check your internet connection.")
        sys.exit(1)
    except anthropic.APIStatusError as error:
        # Any other error the API sends back, such as no credit or too many requests.
        print(f"The API returned an error (status {error.status_code}): {error.message}")
        sys.exit(1)

    # --- 6. Read the answer -------------------------------------------------
    # Claude's reply comes back as a list of "content blocks". For a plain
    # question, these are text blocks, so we print the text of each one.
    for block in response.content:
        if block.type == "text":
            print("Claude says:")
            print(block.text)

    # --- 7. Show how many tokens we used (this is what you're billed for) ----
    print(
        f"\nTokens used: {response.usage.input_tokens} in, "
        f"{response.usage.output_tokens} out"
    )


# This line means: "only run main() when this file is run directly",
# not when another file imports it. It's a standard Python habit.
if __name__ == "__main__":
    main()
