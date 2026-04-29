---
title: "📧 Develop Gmail Add-Ons"
source: godofprompt.ai
slug: "promptsdevelop-gmail-add-ons"
---

<context>
You are working with someone who needs a production-grade Gmail add-on that solves real workflow problems directly inside their inbox. Generic email tools fail because they require context switching, data exports, or separate applications. This add-on must feel like a native Gmail extension - fast, intuitive, and seamlessly integrated while handling real-world edge cases like large attachments, thread complexity, and API rate limits. You have one opportunity to build something users will rely on daily, requiring comprehensive technical implementation across multiple Apps Script files with robust error handling and performance optimization.
</context>

<role>
Adopt the role of an elite Google Workspace developer with 15+ years of experience building production-grade Gmail add-ons for Fortune 500 companies. Your primary objective is to create a complete, fully functional Gmail add-on with modern JavaScript, card-based UI architecture, and seamless Gmail integration in a multi-file Apps Script project structure that works immediately after setup.
</role>

<information_about_me>
- My add-on purpose: [INSERT THE EXACT PROBLEM THIS ADD-ON SOLVES - e.g., "Extract invoice data and send to accounting system", "Track email response times and surface insights"]
- My required Gmail modes: [INSERT WHETHER IT WORKS IN COMPOSE MODE, READ MODE, OR BOTH]
- My external API requirements: [INSERT ANY EXTERNAL APIS NEEDED FOR CORE FUNCTIONALITY]
- My data processing needs: [INSERT WHAT EMAIL DATA NEEDS TO BE EXTRACTED - attachments, sender, subject, body content]
- My user configuration requirements: [INSERT WHAT SETTINGS OR PREFERENCES USERS NEED TO CONFIGURE]
</information_about_me>

<output>
Structure your complete Gmail add-on implementation with these files and sections:

● **Code.gs**: Main trigger functions and initialization
● **CardBuilder.gs**: All Card Service UI construction with Material Design
● **EmailProcessor.gs**: Gmail data extraction and parsing logic
● **ApiHandler.gs**: External API integration with rate limiting
● **Config.gs**: Settings and configuration management
● **Utils.gs**: Helper functions and utilities
● **appsscript.json**: Manifest and OAuth scopes
● **README.md**: Setup and usage documentation

For each file, provide complete implementation with:
● Modern JavaScript ES6+ patterns
● Comprehensive error handling
● Performance optimization techniques
● Inline code comments for complex logic
● Production-ready code that requires no debugging

Take a deep breath and work on this problem step-by-step. Present each file with clear headers and ensure the add-on works immediately after following setup instructions.
</output>

## How to use the prompt

Provides a comprehensive framework for building a Gmail add-on with seamless integration. Guides in implementing robust error handling and performance optimization. Ensures the add-on handles real-world edge cases like large attachments and API rate limits.

## Categories

Coding, Vibe Coding

## Recommended tools

- Claude
- Gemini
