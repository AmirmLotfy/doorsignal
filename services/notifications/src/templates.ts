export interface DoorCardData {
  doorName: string;
  timeStr: string;
  intentTitle: string;
  matchedTitle: string;
  matchReasons: string[];
  actionUrls: {
    acknowledge: string;
    viewLive: string;
    notAMatch: string;
  };
}

export function formatOperationalEmail(data: DoorCardData): { subject: string; text: string; html: string } {
  const subject = `[DoorSignal] ${data.doorName} · ${data.intentTitle} (${data.matchedTitle})`;
  
  const text = `
DOORSIGNAL · ${data.doorName.toUpperCase()}
${data.timeStr}

${data.intentTitle.toUpperCase()}: ${data.matchedTitle}
Why this match:
${data.matchReasons.map(r => `• ${r}`).join('\n')}

Action Links:
• I'm on my way: ${data.actionUrls.acknowledge}
• View Ring Live: ${data.actionUrls.viewLive}
• Not a match: ${data.actionUrls.notAMatch}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F3F0E7; margin: 0; padding: 24px; color: #172221;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #FBFAF5; border: 1px solid #D5DAD5; border-radius: 12px; overflow: hidden; padding: 24px;">
    <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.05em; color: #66716E; margin-bottom: 8px;">
      DOORSIGNAL · ${data.doorName.toUpperCase()} · ${data.timeStr}
    </div>
    <div style="font-size: 13px; font-weight: 600; color: #177D72; margin-bottom: 6px; text-transform: uppercase;">
      ${data.intentTitle}
    </div>
    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #172221;">
      ${data.matchedTitle}
    </h2>
    <div style="background-color: #F3F0E7; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 600; color: #66716E; margin-bottom: 6px;">Why this match</div>
      ${data.matchReasons.map(r => `<div style="font-size: 13px; color: #172221; margin-bottom: 4px;">✓ ${r}</div>`).join('')}
    </div>
    <div style="display: flex; gap: 8px;">
      <a href="${data.actionUrls.acknowledge}" style="background-color: #177D72; color: #FBFAF5; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500;">On My Way</a>
      <a href="${data.actionUrls.viewLive}" style="background-color: #FBFAF5; color: #172221; border: 1px solid #D5DAD5; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500;">View Live</a>
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, text, html };
}
