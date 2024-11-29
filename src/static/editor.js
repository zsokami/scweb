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
} from 'https://esm.sh/@codemirror/view@6.28.6'
import { EditorState } from 'https://esm.sh/@codemirror/state@6.4.1'
import { bracketMatching, indentOnInput } from 'https://esm.sh/@codemirror/language@6.10.5'
import { defaultKeymap, history, historyKeymap, indentWithTab } from 'https://esm.sh/@codemirror/commands@6.7.1'
import { highlightSelectionMatches, searchKeymap } from 'https://esm.sh/@codemirror/search@6.5.8'
import { closeBrackets, closeBracketsKeymap } from 'https://esm.sh/@codemirror/autocomplete@6.18.3'

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
