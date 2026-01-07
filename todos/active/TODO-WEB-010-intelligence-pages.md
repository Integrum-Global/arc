# TODO-WEB-010: Intelligence Pages

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 10h
**Dependencies**: TODO-WEB-006, TODO-BE-020

---

## Objective

Implement the AI intelligence pages including market briefs, natural language portfolio queries, and AI-powered analysis.

---

## Tasks

### 1. Intelligence Dashboard Page
- [ ] Create `src/pages/intelligence/index.tsx`:
  ```typescript
  export default function IntelligencePage() {
    return (
      <PageContainer title="AI Intelligence">
        <Grid cols={2} gap="lg">
          <QuerySection />
          <BriefSection />
        </Grid>
        <AnalysisSection />
      </PageContainer>
    );
  }
  ```

### 2. Query Section
- [ ] Create `src/pages/intelligence/components/QuerySection.tsx`:
  - Query input field
  - Suggested queries list
  - Recent queries history
  - Submit and streaming response
- [ ] Implement streaming display:
  ```typescript
  function useStreamingQuery() {
    const [response, setResponse] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    const query = async (text: string) => {
      setIsStreaming(true);
      setResponse('');

      const stream = await api.intelligence.queryStream(text);
      for await (const chunk of stream) {
        setResponse((prev) => prev + chunk);
      }

      setIsStreaming(false);
    };

    return { response, isStreaming, query };
  }
  ```

### 3. Query Input Component
- [ ] Create `src/pages/intelligence/components/QueryInput.tsx`:
  - Text input with submit
  - Voice input button (placeholder)
  - Loading indicator
  - Clear button
- [ ] Suggested queries dropdown

### 4. Query Response Component
- [ ] Create `src/pages/intelligence/components/QueryResponse.tsx`:
  - Streaming text display
  - Confidence indicator
  - Data tables (when applicable)
  - Sources list
  - Follow-up suggestions
  - Copy button

### 5. Brief Section
- [ ] Create `src/pages/intelligence/components/BriefSection.tsx`:
  - Today's brief (or generate)
  - Brief type selector (daily, weekly)
  - Portfolio context toggle
  - Format selector (summary, detailed)
- [ ] Brief display:
  - Sections with sentiment
  - Key takeaways
  - Action items
  - Related holdings

### 6. Market Brief Card
- [ ] Create `src/pages/intelligence/components/MarketBriefCard.tsx`:
  - Section title
  - Content text
  - Sentiment badge
  - Relevance score
  - Sources

### 7. Analysis Section
- [ ] Create `src/pages/intelligence/components/AnalysisSection.tsx`:
  - Security search
  - Analysis type selector
  - Generate analysis button
  - Analysis display

### 8. Security Analysis Display
- [ ] Create `src/pages/intelligence/components/SecurityAnalysis.tsx`:
  - Summary
  - Financial health gauge
  - Key metrics table
  - Strengths list
  - Concerns list
  - Peer comparison
  - Recommendation

### 9. Anomaly Detection Section
- [ ] Create `src/pages/intelligence/components/AnomalySection.tsx`:
  - Portfolio selector
  - Run detection button
  - Anomaly list:
    - Security
    - Type
    - Severity
    - Description
  - Click for detail

### 10. Brief History Page
- [ ] Create `src/pages/intelligence/briefs/index.tsx`:
  - List of previous briefs
  - Filter by type, date
  - Click to view full brief

---

## Acceptance Criteria

- [ ] Query input with suggestions
- [ ] Streaming query response
- [ ] Confidence and sources shown
- [ ] Brief generation and display
- [ ] Security analysis display
- [ ] Anomaly detection list
- [ ] Brief history
- [ ] Unit test: Components
- [ ] Integration test: Query flow

---

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Intelligence                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Ask about your portfolio...                          [→] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Suggested: "What's my tech exposure?" | "Holdings with..."    │
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐  │
│  │ Query Response              │ │ Today's Brief           │  │
│  │ ─────────────────────────── │ │ ─────────────────────── │  │
│  │ Your technology sector      │ │ 📊 Market Overview      │  │
│  │ exposure is 35.2% ($1.2M)   │ │ Markets opened higher   │  │
│  │ across 8 holdings...        │ │ following positive...   │  │
│  │                             │ │                         │  │
│  │ Confidence: 95%             │ │ 📈 Tech Sector          │  │
│  │ Sources: holdings, prices   │ │ Your holdings showing   │  │
│  │                             │ │ resilience...           │  │
│  │ Follow-up:                  │ │                         │  │
│  │ • Compare to benchmark      │ │ Key Takeaways:          │  │
│  │ • Best valuations in tech   │ │ • Fed rate decision...  │  │
│  └─────────────────────────────┘ └─────────────────────────┘  │
│                                                                 │
│  Security Analysis                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Search Security ▼]  [Comprehensive ▼]    [Analyze]     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Streaming Implementation

```typescript
// Server-sent events for streaming
const eventSource = new EventSource(
  `${API_URL}/intelligence/brief/stream?type=daily`
);

eventSource.onmessage = (event) => {
  const chunk = JSON.parse(event.data);
  setContent((prev) => prev + chunk.text);
};

eventSource.onerror = () => {
  eventSource.close();
  setIsComplete(true);
};
```

---

## Technical Notes

- Use Server-Sent Events for streaming
- Show typing indicator during generation
- Cache briefs for the day
- Track query history locally
- Support markdown in responses
