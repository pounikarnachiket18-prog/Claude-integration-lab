"""
system_prompts.py: see how a system prompt changes Claude's behavior.

Key idea:
    The SAME question, sent with DIFFERENT system prompts, gets very
    different answers. The system prompt is the standing instruction
    sheet Claude reads before the conversation.

How to run it (from the repo's top folder, with the virtual environment active):
    python 01-apis/system_prompts.py --demo   # free: shows the requests, no API calls
    python 01-apis/system_prompts.py          # real: sends 3 small requests (needs ANTHROPIC_API_KEY, costs money)
"""

import json
import os
import sys

MODEL = "claude-haiku-5-5"
MAX_TOKENS = 200

# One question, asked three times.
QUESTION = "What is a variable in programming?"

# Three different system prompts. Each one gives Claude a different role and rules.
SYSTEM_PROMPTS = {
    "Kid-friendly teacher": (
        "You are a patient teacher for 10-year-olds. "
        "Use a fun everyday analogy. Maximum 2 sentences. No code."
    ),
    "Senior engineer": (
        "You are a senior software engineer talking to a colleague. "
        "Be precise and technical. Include one short Python example."
    ),
    "Pirate": (
        "You are a pirate. Answer correctly, but always talk like a pirate. "
        "Keep it to 2 sentences."
    ),
    "Haiku Poet": (
        "You only answer in a single haiku (5-7-5 syllables)."
    ),
}


def build_request(system_prompt):
    """Build the exact data we send to Claude. Notice where 'system' goes."""
    return {
        "model": MODEL,
        "max_tokens": MAX_TOKENS,
        "system": system_prompt,  # <- its own parameter, NOT inside messages
        "messages": [
            {"role": "user", "content": QUESTION},
        ],
    }


def main():
    demo = "--demo" in sys.argv

    client = None
    if not demo:
        if not os.environ.get("ANTHROPIC_API_KEY"):
            print("No API key found. Set ANTHROPIC_API_KEY, or run with --demo to practice for free.")
            sys.exit(1)
        import anthropic
        client = anthropic.Anthropic()

    for name, system_prompt in SYSTEM_PROMPTS.items():
        request = build_request(system_prompt)
        print("=" * 60)
        print(f"Persona: {name}")

        if demo:
            # Show exactly what WOULD be sent, without sending it.
            print("Request that would be sent:")
            print(json.dumps(request, indent=2))
        else:
            response = client.messages.create(**request)  # ** unpacks the dict into named arguments
            text = "".join(b.text for b in response.content if b.type == "text")
            print(f"Claude: {text}")

    print("=" * 60)
    print("Same question, same model. Only the system prompt changed.")


if __name__ == "__main__":
    main()
