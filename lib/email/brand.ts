// Use the PNG and an absolute URL for email clients that cannot display SVG.
export function emailBrandMark(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="display:inline-table;vertical-align:middle"><tr><td style="padding-right:10px;vertical-align:middle"><img src="https://ugc.community/icon.png" alt="" width="32" height="32" style="display:block;border:0;width:32px;height:32px" /></td><td style="vertical-align:middle;font-family:Arial,sans-serif;font-size:20px;font-weight:600;color:#1A1614;white-space:nowrap">ugc.community</td></tr></table>`;
}
