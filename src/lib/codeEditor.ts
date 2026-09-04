const INDENT = '    '

export type EditorSelection = {
    value: string
    selectionStart: number
    selectionEnd: number
}

export function handleEditorKey(
    value: string,
    selectionStart: number,
    selectionEnd: number,
    key: string,
    shiftKey: boolean,
): EditorSelection | null {
    if (key === 'Tab') {
        return shiftKey
            ? unindentSelection(value, selectionStart, selectionEnd)
            : indentSelection(value, selectionStart, selectionEnd)
    }

    if (key === 'Enter') {
        return continueIndent(value, selectionStart, selectionEnd)
    }

    return null
}

function indentSelection(value: string, start: number, end: number): EditorSelection {
    if (start === end) {
        return {
            value: value.slice(0, start) + INDENT + value.slice(end),
            selectionStart: start + INDENT.length,
            selectionEnd: start + INDENT.length,
        }
    }

    const { from, to } = blockRange(value, start, end)
    const block = value.slice(from, to)
    const nextBlock = block
        .split('\n')
        .map((line) => INDENT + line)
        .join('\n')

    return {
        value: value.slice(0, from) + nextBlock + value.slice(to),
        selectionStart: start + INDENT.length,
        selectionEnd: end + (nextBlock.length - block.length),
    }
}

function unindentSelection(value: string, start: number, end: number): EditorSelection {
    const { from, to } = blockRange(value, start, end)
    const block = value.slice(from, to)
    let removedBeforeCursor = 0
    let removedTotal = 0
    let cursor = from

    const nextBlock = block
        .split('\n')
        .map((line) => {
            const cut = leadingIndentSize(line)
            if (cursor < start) removedBeforeCursor += cut
            removedTotal += cut
            cursor += line.length + 1
            return line.slice(cut)
        })
        .join('\n')

    return {
        value: value.slice(0, from) + nextBlock + value.slice(to),
        selectionStart: Math.max(from, start - removedBeforeCursor),
        selectionEnd: Math.max(from, end - removedTotal),
    }
}

function continueIndent(value: string, start: number, end: number): EditorSelection {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const currentLine = value.slice(lineStart, start)
    const indent = currentLine.match(/^ */)?.[0] ?? ''
    const insert = `\n${indent}`

    return {
        value: value.slice(0, start) + insert + value.slice(end),
        selectionStart: start + insert.length,
        selectionEnd: start + insert.length,
    }
}

function blockRange(value: string, start: number, end: number): { from: number; to: number } {
    const from = value.lastIndexOf('\n', start - 1) + 1
    if (end > start && value[end - 1] === '\n') {
        return { from, to: end - 1 }
    }

    const lineEnd = value.indexOf('\n', end)
    return { from, to: lineEnd === -1 ? value.length : lineEnd }
}

function leadingIndentSize(line: string): number {
    let count = 0
    while (count < INDENT.length && line[count] === ' ') count += 1
    return count
}
