import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from 'https://cdn.jsdelivr.net/npm/@codemirror/view@6.35.0/+esm'
import { EditorState } from 'https://cdn.jsdelivr.net/npm/@codemirror/state@6.4.1/+esm'
import { bracketMatching, indentOnInput } from 'https://cdn.jsdelivr.net/npm/@codemirror/language@6.10.5/+esm'
import { defaultKeymap, history, historyKeymap, indentWithTab } from 'https://cdn.jsdelivr.net/npm/@codemirror/commands@6.7.1/+esm'
import { highlightSelectionMatches, searchKeymap } from 'https://cdn.jsdelivr.net/npm/@codemirror/search@6.5.8/+esm'
import { closeBrackets, closeBracketsKeymap } from 'https://cdn.jsdelivr.net/npm/@codemirror/autocomplete@6.18.3/+esm'

export function createEditor({
  doc = '',
  parent = undefined,
  onUpdate = undefined,
}) {
  return new EditorView({
    doc,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        indentWithTab,
      ]),
      EditorView.lineWrapping,
      ...onUpdate ? [EditorView.updateListener.of(onUpdate)] : [],
    ],
    parent,
  })
}
