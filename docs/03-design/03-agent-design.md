# Agent Design (Kaizen)

> [!NOTE]
> **Kaizen Specialist Directive**: Use BaseAgent architecture with Signature-based programming.

## Architecture
All agents inherit from `kaizen.core.base_agent.BaseAgent`.

### Agent Types
1.  **AdvisorAgent**: Analysis of market data and portfolio recommendations.
2.  **SupportAgent**: RAG-based user support.
3.  **TransactionAgent**: Handles sensitive operations (requires Approval Workflow).

## Configuration
- **LLM Provider**: `openai` (GPT-4o) or `google` (Gemini 2.0 Flash) for performance.
- **Tooling**: Agents use **Autonomous Tool Calling** with permissions.

## Pattern: Signature-Based I/O
```python
class MarketAnalysisSignature(Signature):
    symbol: str = InputField(desc="Stock symbol to analyze")
    sentiment: str = OutputField(desc="Bullish/Bearish sentiment")
    confidence: float = OutputField(desc="0.0 to 1.0 confidence score")
```

## Coordination
- **A2A Protocol**: Agents discover each other's capabilities dynamically.
- **Control Protocol**: Used for "Human-in-the-Loop" approval on high-value transactions.
