# TODO-MOB-010: Intelligence Page

**Priority**: MEDIUM
**Status**: ACTIVE
**Estimated Effort**: 8h
**Dependencies**: TODO-MOB-006, TODO-BE-020

---

## Objective

Implement the AI intelligence screen with natural language portfolio queries, market briefs, and AI-powered analysis.

---

## Tasks

### 1. Intelligence Screen
- [ ] Create `lib/features/intelligence/presentation/screens/intelligence_screen.dart`:
  - Query input at top
  - Suggested queries
  - Brief section
  - Analysis section
  - Recent queries history

### 2. Query Input Section
- [ ] Create `lib/features/intelligence/presentation/widgets/query_input_section.dart`:
  - Text input field
  - Voice input button
  - Submit button
  - Loading indicator
  - Clear button

### 3. Query Response Display
- [ ] Create `lib/features/intelligence/presentation/widgets/query_response.dart`:
  - Streaming text display (typewriter effect)
  - Markdown rendering support
  - Confidence indicator
  - Data tables (when applicable)
  - Sources list
  - Follow-up suggestions
  - Copy button

### 4. Voice Input Button
- [ ] Create `lib/features/intelligence/presentation/widgets/voice_input_button.dart`:
  - Microphone icon
  - Pulse animation when listening
  - Speech-to-text integration
  - Permission handling
  - Cancel on tap

### 5. Suggested Queries
- [ ] Create `lib/features/intelligence/presentation/widgets/suggested_queries.dart`:
  - Horizontal scrollable chips
  - Common queries:
    - "What's my tech exposure?"
    - "Show holdings with high P/E"
    - "Which securities have declining margins?"
    - "Summarize my portfolio risk"
  - Tap to execute

### 6. Brief Section
- [ ] Create `lib/features/intelligence/presentation/widgets/brief_section.dart`:
  - Today's brief (if available)
  - Brief type selector (Daily/Weekly)
  - Generate brief button
  - Streaming generation display
  - Key takeaways list
  - Related holdings

### 7. Market Brief Card
- [ ] Create `lib/features/intelligence/presentation/widgets/brief_card.dart`:
  - Section title
  - Content text (expandable)
  - Sentiment badge (bullish/bearish/neutral)
  - Relevance score
  - Sources
  - Tap to expand

### 8. Chat Screen
- [ ] Create `lib/features/intelligence/presentation/screens/chat_screen.dart`:
  - Full-screen chat interface
  - Message list (ChatBubble)
  - Input bar at bottom
  - Streaming responses
  - Context preservation

### 9. Chat Bubble
- [ ] Create `lib/features/intelligence/presentation/widgets/chat_bubble.dart`:
  - User messages (right aligned, primary color)
  - AI messages (left aligned, surface color)
  - AI avatar icon
  - Markdown support
  - Loading dots animation
  - Timestamp

### 10. Analysis Section
- [ ] Create `lib/features/intelligence/presentation/widgets/analysis_section.dart`:
  - Security search input
  - Analysis type selector (Comprehensive, Quick, Risk)
  - Generate analysis button
  - Analysis display:
    - Summary
    - Financial health gauge
    - Key metrics table
    - Strengths list
    - Concerns list
    - Peer comparison
    - Recommendation

---

## Acceptance Criteria

- [ ] Query input works with text
- [ ] Voice input captures speech
- [ ] Query response streams correctly
- [ ] Markdown renders properly
- [ ] Brief generation works
- [ ] Chat interface functional
- [ ] Chat bubbles display correctly
- [ ] Analysis generates and displays
- [ ] Loading states shown
- [ ] Error handling works

---

## Intelligence Screen Layout

```
┌─────────────────────────────────────┐
│  AI Intelligence                    │
├─────────────────────────────────────┤
│  ┌─────────────────────────────[🎤]│
│  │ Ask about your portfolio...     ││
│  └─────────────────────────────────┘│
│                                     │
│  [Tech exposure?] [High P/E] [Risk] │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Query Response                  ││
│  │ ────────────────────────────────││
│  │ Your technology sector exposure ││
│  │ is 35.2% ($525K) across 8       ││
│  │ holdings...                     ││
│  │                                 ││
│  │ Confidence: 95%                 ││
│  │ Sources: holdings, prices       ││
│  │                                 ││
│  │ Follow-up:                      ││
│  │ • Compare to benchmark          ││
│  │ • Best valuations in tech       ││
│  └─────────────────────────────────┘│
│                                     │
│  Today's Brief         [Read More] │
│  ┌─────────────────────────────────┐│
│  │ 📊 Market Overview              ││
│  │ Markets opened higher following ││
│  │ positive Fed signals...         ││
│  │                                 ││
│  │ Key Takeaways:                  ││
│  │ • Fed signals rate pause        ││
│  │ • Tech earnings beat estimates  ││
│  └─────────────────────────────────┘│
│                                     │
│  Security Analysis                  │
│  ┌─────────────────────────────────┐│
│  │ [Search Security ▼] [Analyze]   ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## Streaming Implementation

```dart
// Use SSE for streaming responses
Stream<String> streamQuery(String query) async* {
  final response = await dio.get<ResponseBody>(
    '/intelligence/query/stream',
    queryParameters: {'q': query},
    options: Options(responseType: ResponseType.stream),
  );

  await for (final chunk in response.data!.stream) {
    yield String.fromCharCodes(chunk);
  }
}

// Usage in provider
final queryStreamProvider = StreamProvider.family<String, String>((ref, query) {
  final api = ref.watch(apiClientProvider);
  return api.streamQuery(query);
});
```

---

## Voice Input

```dart
// speech_to_text package
final speech = SpeechToText();
await speech.initialize();

await speech.listen(
  onResult: (result) {
    if (result.finalResult) {
      onQuerySubmit(result.recognizedWords);
    }
  },
  listenFor: Duration(seconds: 30),
  pauseFor: Duration(seconds: 3),
);
```

---

## Technical Notes

- Use speech_to_text for voice input
- Use Server-Sent Events for streaming
- Cache briefs (1 hour)
- Track query history locally (Hive)
- Support markdown in responses
- Show typing indicator during generation
- Handle partial responses gracefully
