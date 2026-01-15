# Alert Sound Files

This directory contains sound files for the ARC alert system.

## Required Files

The following sound files are referenced by the SoundManager:

1. **alert-critical.mp3** - Critical alert sound (urgent, attention-grabbing)
2. **alert-warning.mp3** - Warning alert sound (moderate alert tone)
3. **alert-info.mp3** - Info alert sound (subtle notification)

## File Requirements

- **Format**: MP3, 16-44kHz
- **Size**: <100KB each
- **Duration**: 0.5-2 seconds
- **Licensing**: Must be royalty-free or properly licensed

## Sound Characteristics

### Critical (alert-critical.mp3)
- **Severity**: Tier 1 alerts (margin calls, position limit breaches, system failures)
- **Response Time**: < 5 minutes
- **Characteristics**: Urgent, attention-grabbing, but not jarring
- **Volume**: Slightly louder base level
- **Example Use Cases**: Margin call alerts, position limit breaches

### Warning (alert-warning.mp3)
- **Severity**: Tier 2 alerts (threshold breaches, health scan issues)
- **Response Time**: Same business day
- **Characteristics**: Moderate alert tone, noticeable but not alarming
- **Volume**: Medium base level
- **Example Use Cases**: Concentration warnings, threshold breaches

### Info (alert-info.mp3)
- **Severity**: Tier 3 alerts (informational updates)
- **Response Time**: At leisure
- **Characteristics**: Subtle notification, gentle tone
- **Volume**: Softer base level
- **Example Use Cases**: Ratio changes, market updates

## Finding Sound Files

### Free Resources
1. **Freesound.org** - https://freesound.org/ (CC licenses)
2. **Zapsplat** - https://www.zapsplat.com/ (free for attribution)
3. **Mixkit** - https://mixkit.co/free-sound-effects/notification/ (free license)
4. **Notification Sounds** - https://notificationsounds.com/ (free)

### Search Terms
- "notification sound"
- "alert tone"
- "system alert"
- "ui notification"

### Alternative: Generate Sounds
You can also generate simple alert tones programmatically using:
- **Audacity** (free, open-source audio editor)
- **Online Tone Generator** - https://www.szynalski.com/tone-generator/
- **Web Audio API** (programmatic generation in browser)

## Installation

Once you have obtained suitable sound files:

1. Place the MP3 files in this directory:
   ```
   public/sounds/
   ├── alert-critical.mp3
   ├── alert-warning.mp3
   └── alert-info.mp3
   ```

2. Verify file sizes are under 100KB each:
   ```bash
   ls -lh public/sounds/*.mp3
   ```

3. Test sounds in the browser:
   ```javascript
   import { soundManager } from '@/lib/soundManager';

   soundManager.play('critical');
   soundManager.play('warning');
   soundManager.play('info');
   ```

## Testing

The sound manager includes comprehensive tests that mock the Audio API. No actual sound files are needed for unit tests.

To test with real sounds:

1. Ensure sound files are in place
2. Run the web app: `npm run dev`
3. Trigger test alerts through the UI
4. Verify sounds play correctly
5. Test quiet hours functionality
6. Test volume controls

## Browser Compatibility

The SoundManager uses the HTML5 Audio API, which is supported by all modern browsers:

- Chrome 4+
- Firefox 3.5+
- Safari 4+
- Edge (all versions)
- Opera 10.5+

## Autoplay Policy

Modern browsers block autoplay of audio without user interaction. The SoundManager handles this gracefully:

- First sound may not play until user interacts with the page
- Console debug message: "Sound blocked by browser autoplay policy"
- No errors thrown
- Subsequent sounds play normally after interaction

## Future Enhancements

Potential improvements for future releases:

- [ ] User-customizable sound files
- [ ] Web Audio API for programmatic sound generation
- [ ] Sound visualization during playback
- [ ] A/B testing for optimal alert tones
- [ ] Accessibility: Visual alternatives for hearing-impaired users
- [ ] Sound ducking (reducing volume when user is actively typing)
