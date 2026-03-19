'use client';

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * SearchHighlight — TipTap 搜索高亮扩展
 *
 * 在编辑器中为所有匹配项添加黄色高亮装饰；
 * 当前选中的匹配项使用橙色高亮。
 *
 * 使用方式：
 *   editor.commands.setSearchHighlight({ matches, currentIndex })
 *   editor.commands.clearSearchHighlight()
 */

export const searchHighlightPluginKey = new PluginKey('searchHighlight');

export const SearchHighlightExtension = Extension.create({
    name: 'searchHighlight',

    addCommands() {
        return {
            setSearchHighlight: ({ matches, currentIndex }) => ({ tr, dispatch }) => {
                if (dispatch) {
                    tr.setMeta(searchHighlightPluginKey, { matches, currentIndex });
                }
                return true;
            },
            clearSearchHighlight: () => ({ tr, dispatch }) => {
                if (dispatch) {
                    tr.setMeta(searchHighlightPluginKey, { matches: [], currentIndex: -1 });
                }
                return true;
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: searchHighlightPluginKey,
                state: {
                    init() {
                        return { decorations: DecorationSet.empty, matches: [], currentIndex: -1 };
                    },
                    apply(tr, prev, _oldState, newState) {
                        const meta = tr.getMeta(searchHighlightPluginKey);
                        if (!meta) {
                            // 文档内容变化时，映射已有的装饰位置
                            if (tr.docChanged) {
                                return {
                                    ...prev,
                                    decorations: prev.decorations.map(tr.mapping, tr.doc),
                                };
                            }
                            return prev;
                        }
                        const { matches, currentIndex } = meta;
                        if (!matches || matches.length === 0) {
                            return { decorations: DecorationSet.empty, matches: [], currentIndex: -1 };
                        }
                        const decos = matches.map((m, i) => {
                            const isCurrent = i === currentIndex;
                            return Decoration.inline(m.from, m.to, {
                                style: isCurrent
                                    ? 'background: rgba(255, 152, 0, 0.55); border-radius: 2px; box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.5);'
                                    : 'background: rgba(255, 213, 79, 0.45); border-radius: 2px; box-shadow: 0 0 0 1px rgba(255, 193, 7, 0.35);',
                                class: isCurrent ? 'search-highlight-current' : 'search-highlight',
                            });
                        });
                        return {
                            decorations: DecorationSet.create(newState.doc, decos),
                            matches,
                            currentIndex,
                        };
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state)?.decorations || DecorationSet.empty;
                    },
                },
            }),
        ];
    },
});
