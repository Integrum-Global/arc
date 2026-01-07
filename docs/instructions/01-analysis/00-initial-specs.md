# Objective
ARC is an investment management product, my target audiences are: 1. investment managers, 2.
  family offices. I want you to adopt their personas and give me a number of scenarios centering on
  these key value propositions:
  1. Portfolio/Financial diagnostics - using 5 classes of financial ratios (liquidity,
  profitability, asset utilization, leverage, valuation).
  2. Benchmarking against listed peers - data to come from 3rd party connectors (eodhd, capitalIQ)
  3. To also include non-listed companies - data to come from pitchbook.
  4. Portfolio management according to my framework (see image)
  5. Explicit intelligence (market, portfolio, insights etc) module/capability 

# Scenarios (User Stories)
  Persona 1: Investment Manager

  Portfolio/Financial Diagnostics
  - As an investment manager, I want to run a quick financial health scan across my portfolio using the 5 ratio classes, so that I can identify underperforming holdings requiring attention.
  - As an investment manager, I want to set threshold alerts on key ratios (e.g., current ratio < 1.5), so that I'm notified when portfolio companies show deteriorating fundamentals.

  Benchmarking (Listed Peers)
  - As an investment manager, I want to compare my holdings against sector peers using EODHD/CapitalIQ data, so that I can justify position sizing decisions to stakeholders.
  - As an investment manager, I want to generate peer comparison reports automatically, so that I can include them in quarterly investor communications without manual work.

  Non-Listed Companies
  - As an investment manager, I want to pull private company financials from Pitchbook, so that I can evaluate pre-IPO opportunities alongside my public holdings.
  - As an investment manager, I want to benchmark private holdings against comparable public peers, so that I can establish fair value estimates.

  Portfolio Management
  - As an investment manager, I want to run optimization scenarios (Mean-Variance, Black-Litterman) against my current allocation, so that I can identify rebalancing opportunities.
  - As an investment manager, I want to ensure trades pass pre-trade compliance checks automatically, so that I avoid mandate breaches.

  Intelligence
  - As an investment manager, I want to receive AI-generated market briefs incorporating news and alternative data, so that I can make informed decisions without reading 50 sources.
  - As an investment manager, I want to query the knowledge base about specific sectors or holdings, so that I can quickly surface relevant research.

  ---
  Persona 2: Family Office

  Portfolio/Financial Diagnostics
  - As a family office principal, I want to see a consolidated diagnostic dashboard across all asset classes, so that I understand our overall financial position at a glance.
  - As a family office principal, I want to track profitability and leverage ratios for our direct investments, so that I can assess business health without relying solely on management reports.

  Benchmarking (Listed Peers)
  - As a family office, I want to benchmark our public equity sleeve against relevant indices and peers, so that I can evaluate external manager performance.

  Non-Listed Companies
  - As a family office, I want to integrate Pitchbook data for our private equity and direct investments, so that I have a unified view across listed and unlisted holdings.
  - As a family office, I want to track private company comparables over time, so that I can monitor valuation drift.

  Portfolio Management
  - As a family office, I want to model strategic asset allocation aligned with our multi-generational objectives, so that I can plan capital preservation and growth.
  - As a family office, I want to generate client reports showing performance attribution, so that beneficiaries understand how returns were achieved.

  Intelligence
  - As a family office, I want to receive curated intelligence on our specific holdings and sectors of interest, so that I stay informed without information overload.
  - As a family office, I want to ask natural language questions about our portfolio risk exposure, so that I don't need specialized analyst support for routine queries.

  ---
  Cross-Cutting Stories
  - As a user, I want to connect data sources (EODHD, CapitalIQ, Pitchbook) once and have ratios calculated automatically, so that I avoid manual data wrangling.
  - As a user, I want to export any analysis to PDF/Excel, so that I can share findings with stakeholders who don't use ARC.


# Tasks for Claude Code
1. Research thoroughly and distill the value propositions and UNIQUE SELLING POINTS of our product/solution
   - Scrutinize and critique my user stories, with the focus of improving the product.
   - Ensure that we are explicit and clear about the features that users require customizations for, and build them as self-service features.
   - Create opportunities for advanced consulting and AI research and development.
   - For reference, my portfolio management framework is '/Users/esperie/Downloads/Screenshot 2026-01-07 at 11.33.28.png'
2. Evaluate it using the AAA framework
   - Automate: Reduce operational costs
   - Augment: Reduce decision-making costs
   - Amplify: Reduce expertise costs (for scaling)
3. Features must sufficiently cover the following network behaviors to achieve strong network effects
   - Accessibility: Easy for users to complete a transaction
     - transaction is activity between producer and consumer, not necessarily monetary in nature)
   - Engagement: Information that are useful to users for completing a transaction
   - Personalization: Information that are curated for an intended use
   - Connection: Information sources that are connected to the platform (one or two-way)
   - Collaboration: Producers and consumers can jointly work together seamlessly
4. Coding stack
   - Work with subagents and understand what the kailash stack (kailash sdk with frameworks - dataflow, kaizen, nexus) is capable of
   - Use this stack as the base of our solutions
5. Code Structure
   - Backend codes to be in src/arc
   - Frontend codes during development, will be in apps/web for web applications (react) and apps/mobile for mobile applications (flutter)
   - Post development, the frontend codes will be extracted as separate repositories, so treat these directories accordingly
6. Document in details, your analysis in docs/01-analysis, and plans in docs/02-plans, and user flows in src/arc/docs/user-flows.
   - Use as many subdirectories and files as required
   - Name them sequentially as 01-, 02-, etc, for easy referencing

## Checks
1. If plans are too thin:
    your plans are way too thin. Peruse @docs/01-analysis/ again using ultrathink, then give me the 
    detailed plans in docs/02-plans.
       - Use as many subdirectories and files as required
       - Name them sequentially as 01-, 02-, etc, for easy referencing
    
    I need the plans to be detailed enough so that todo-manager can create detailed todos without gaps
     based on these plans. Subsequently, the developers are going to work in parallel on the detailed
    todos without the need to reference the plans and our solution will still be seamless as a piece
    of symbiotic product.

# Additional Notes
What is a Platform Model?
- Users (producers, consumers, partners)
  - Producers: Users who offer/deliver a product or service
  - Consumers: Users who consume a product or service
  - Partners: To facilitate the transaction between producers and consumers
