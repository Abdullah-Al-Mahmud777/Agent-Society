# Agent Output System - Quick Start Guide

## What's Included

Your new Agent Output System includes:

✅ **JSON Export** - Individual or all agents  
✅ **CSV Export** - Spreadsheet format  
✅ **PDF Export** - Professional reports  
✅ **Rich Text Editor** - Markdown support with templates  
✅ **Content Management** - Undo/Redo, custom content  
✅ **API Routes** - Server-side export generation  

## Files Created

### Core Libraries
- `src/lib/output-service.js` - Main export functions
- `src/lib/output-utils.js` - Utilities & format converters

### State Management
- `src/store/content-editor-store.js` - Content editor state

### Components
- `src/components/output/OutputToolbar.js` - Export toolbar
- `src/components/output/ExportDialog.js` - Export options dialog
- `src/components/output/ContentEditor.js` - Rich text editor
- `src/components/output/ExampleIntegration.js` - Integration example

### API Routes
- `src/app/api/export/json/route.js`
- `src/app/api/export/csv/route.js`
- `src/app/api/export/pdf/route.js`

### Documentation
- `OUTPUT_SYSTEM.md` - Full documentation
- `QUICK_START.md` - This file

## How to Use

### 1. Add Export Toolbar to Your App

Open the file where you display your agents and add:

```javascript
import OutputToolbar from "@/components/output/OutputToolbar";

export default function MyAgentPage() {
  const agents = []; // Your agents here

  return (
    <div>
      <OutputToolbar agents={agents} />
      {/* Rest of your content */}
    </div>
  );
}
```

### 2. Ensure Agent Objects Have Required Properties

Your agent objects should include:
```javascript
{
  id: "unique-id",
  name: "Agent Name",
  role: "Agent Role",
  description: "Description",
  icon: "🤖",
  color: "#00FF00",
  isEnabled: true,
  aiProvider: "OpenAI",
  model: "gpt-4",
  temperature: 0.7
}
```

### 3. Click Export Button

Users can now:
- Click the export button in the toolbar
- Choose format (JSON, CSV, PDF)
- Add custom content (PDF only)
- Download the file

## Export Formats

### JSON Export
```json
{
  "exportDate": "2024-01-01T12:00:00Z",
  "summary": {
    "totalAgents": 5,
    "enabledCount": 4,
    "disabledCount": 1
  },
  "agents": [...]
}
```

### CSV Export
Spreadsheet-friendly format with columns:
- Name, Role, Icon, AI Provider, Model, Temperature, Enabled, Description

### PDF Export
Professional report with:
- Agent cards with visual formatting
- Color-coded status indicators
- Custom content support
- Print-ready styling

## Advanced Usage

### Programmatic Export

```javascript
import { exportAllAgentsAsJson } from "@/lib/output-service";

// Export programmatically
exportAllAgentsAsJson(agents, "custom-filename.json");
```

### Content Editor Store

```javascript
import { useContentEditorStore } from "@/store/content-editor-store";

function MyComponent() {
  const openEditor = useContentEditorStore(state => state.openContentEditor);
  const content = useContentEditorStore(state => state.getContent());
  
  return <button onClick={openEditor}>Edit Content</button>;
}
```

### Format Conversion

```javascript
import { formatConverters } from "@/lib/output-utils";

const plainText = formatConverters.toPlainText(markdownContent);
const html = formatConverters.toHtml(markdownContent);
```

## Markdown Support

The rich text editor supports:
- `# Heading 1`, `## Heading 2`, `### Heading 3`
- `**bold text**`
- `*italic text*`
- `- List items`
- `[Link text](url)`
- Backtick code: `` `code` ``

## Templates Available

Pre-built templates for quick content creation:

**Headers**: Title, Section, Subsection
**Formatting**: Bold, Italic, Lists
**Sections**: Summary, Findings, Recommendations, Risks

## Configuration Options

### Customize PDF Styling

Edit `src/lib/output-service.js` in the `buildPdfContent()` function to customize:
- Colors
- Fonts
- Spacing
- Layout

### Add New Export Formats

1. Add function to `output-service.js`
2. Update `ExportDialog.js` with new option
3. Handle in export handler

## Browser Compatibility

✅ Chrome/Edge - Full support
✅ Firefox - Full support
✅ Safari - Full support
⚠️ Mobile - Limited print functionality

## Performance Tips

- **Large datasets** (1000+ agents): Use CSV export
- **PDF generation**: Works client-side for instant feedback
- **Multiple exports**: Content editor stores history efficiently

## Troubleshooting

### Export button is disabled
- Ensure `agents` array is not empty
- Verify agents have all required properties

### PDF not generating
- Check browser console for errors
- Verify custom content is valid Markdown
- Try simpler content first

### Content not saving
- Check browser localStorage isn't full
- Clear cache and try again
- Check browser console for errors

## Next Steps

1. ✅ Add OutputToolbar to your app
2. ✅ Test exports with sample data
3. ✅ Customize PDF styling if needed
4. ✅ Add more export formats as needed
5. ✅ Integrate with your workflow

## Getting Help

Refer to:
- `OUTPUT_SYSTEM.md` - Full technical documentation
- `src/components/output/ExampleIntegration.js` - Integration examples
- Component files for implementation details

## File Sizes

- `output-service.js` - ~6 KB
- `output-utils.js` - ~7 KB
- Components combined - ~10 KB
- Total with API routes - ~25 KB (uncompressed)

Ready to integrate! 🚀
