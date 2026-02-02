'use client'

import { useMemo } from 'react'
import type { CharacterWithAttributes, CharacterRelationship, Character } from '@/types/database'
import styles from './RelationshipGraph.module.css'

interface RelationshipGraphProps {
    characters: CharacterWithAttributes[]
    relationships: (CharacterRelationship & {
        fromCharacter: Character
        toCharacter: Character
    })[]
    onCharacterClick?: (character: CharacterWithAttributes) => void
}

interface Node {
    id: string
    name: string
    x: number
    y: number
    character: CharacterWithAttributes
}

interface Edge {
    id: string
    from: string
    to: string
    label: string
    description?: string
}

export function RelationshipGraph({
    characters,
    relationships,
    onCharacterClick
}: RelationshipGraphProps) {
    // ノードの配置を計算（円形配置）
    const nodes = useMemo<Node[]>(() => {
        const centerX = 300
        const centerY = 250
        const radius = 180

        return characters.map((char, index) => {
            const angle = (2 * Math.PI * index) / characters.length - Math.PI / 2
            return {
                id: char.id,
                name: char.nicknames?.[0] || char.name,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                character: char
            }
        })
    }, [characters])

    // エッジを計算
    const edges = useMemo<Edge[]>(() => {
        return relationships.map((rel) => ({
            id: rel.id,
            from: rel.from_character_id,
            to: rel.to_character_id,
            label: rel.relationship_type,
            description: rel.description || undefined
        }))
    }, [relationships])

    // ノードのマップを作成
    const nodeMap = useMemo(() => {
        return new Map(nodes.map((n) => [n.id, n]))
    }, [nodes])

    if (characters.length === 0) {
        return (
            <div className={styles.empty}>
                <p>登場人物を追加すると相関図が表示されます</p>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>人物相関図</h3>
            <div className={styles.graphWrapper}>
                <svg
                    className={styles.graph}
                    viewBox="0 0 600 500"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                        >
                            <polygon
                                points="0 0, 10 3.5, 0 7"
                                fill="rgba(167, 139, 250, 0.6)"
                            />
                        </marker>
                    </defs>

                    {/* エッジ（関係線） */}
                    {edges.map((edge) => {
                        const fromNode = nodeMap.get(edge.from)
                        const toNode = nodeMap.get(edge.to)
                        if (!fromNode || !toNode) return null

                        // ノード間の中点を計算
                        const midX = (fromNode.x + toNode.x) / 2
                        const midY = (fromNode.y + toNode.y) / 2

                        // ノードの半径分オフセット
                        const dx = toNode.x - fromNode.x
                        const dy = toNode.y - fromNode.y
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        const nodeRadius = 35
                        const startX = fromNode.x + (dx / dist) * nodeRadius
                        const startY = fromNode.y + (dy / dist) * nodeRadius
                        const endX = toNode.x - (dx / dist) * nodeRadius
                        const endY = toNode.y - (dy / dist) * nodeRadius

                        return (
                            <g key={edge.id} className={styles.edge}>
                                <line
                                    x1={startX}
                                    y1={startY}
                                    x2={endX}
                                    y2={endY}
                                    stroke="rgba(167, 139, 250, 0.4)"
                                    strokeWidth="2"
                                    markerEnd="url(#arrowhead)"
                                />
                                <text
                                    x={midX}
                                    y={midY - 8}
                                    className={styles.edgeLabel}
                                    textAnchor="middle"
                                >
                                    {edge.label}
                                </text>
                            </g>
                        )
                    })}

                    {/* ノード（人物） */}
                    {nodes.map((node) => (
                        <g
                            key={node.id}
                            className={styles.node}
                            transform={`translate(${node.x}, ${node.y})`}
                            onClick={() => onCharacterClick?.(node.character)}
                            style={{ cursor: onCharacterClick ? 'pointer' : 'default' }}
                        >
                            <circle
                                r="35"
                                fill="rgba(124, 58, 237, 0.3)"
                                stroke="#7c3aed"
                                strokeWidth="2"
                            />
                            <text
                                className={styles.nodeLabel}
                                textAnchor="middle"
                                dy="5"
                            >
                                {node.name.length > 6 ? node.name.slice(0, 5) + '…' : node.name}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            {/* 関係性の凡例 */}
            {relationships.length > 0 && (
                <div className={styles.legend}>
                    <h4 className={styles.legendTitle}>関係性</h4>
                    <ul className={styles.legendList}>
                        {relationships.map((rel) => (
                            <li key={rel.id} className={styles.legendItem}>
                                <span className={styles.legendFrom}>
                                    {rel.fromCharacter.nicknames?.[0] || rel.fromCharacter.name}
                                </span>
                                <span className={styles.legendArrow}>→</span>
                                <span className={styles.legendTo}>
                                    {rel.toCharacter.nicknames?.[0] || rel.toCharacter.name}
                                </span>
                                <span className={styles.legendType}>{rel.relationship_type}</span>
                                {rel.description && (
                                    <span className={styles.legendDesc}>({rel.description})</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
