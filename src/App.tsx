import Editor from '@monaco-editor/react'
import { invoke } from '@tauri-apps/api/core'
import mermaid from 'mermaid'
import { useEffect, useRef, useState } from 'react'
import './App.css'

const INITIAL_SOURCE = `flowchart LR
A[开始] --> B[采集需求]
B --> C[解析 Mermaid]
C --> D[渲染交互画布]
D --> E[导出 PNG]
`

type MermaidParseHash = {
  line?: number
  loc?: {
    first_line?: number
    first_column?: number
  }
  expected?: string[]
  token?: string
  text?: string
}

type MermaidTemplate = {
  id: string
  label: string
  code: string
}

const MERMAID_TEMPLATES: MermaidTemplate[] = [
  {
    id: 'architecture',
    label: 'Architecture（架构图）',
    code: `architecture-beta
service api(server)[API]
service db(database)[Database]
service web(internet)[Web]
web:R -- L:api
api:R -- L:db`,
  },
  {
    id: 'block',
    label: 'Block（块图）',
    code: `block-beta
columns 2
A["网关"] B["应用服务"]
C["缓存"] D["数据库"]
A --> B
B --> D
B --> C`,
  },
  {
    id: 'c4',
    label: 'C4（软件架构）',
    code: `C4Context
title 用户登录上下文
Person(user, "用户")
System(system, "Mermaid Flow Pro", "流程图编辑系统")
System_Ext(cas, "CAS", "统一认证服务")
Rel(user, system, "使用")
Rel(system, cas, "认证")`,
  },
  {
    id: 'class',
    label: 'Class（类图）',
    code: `classDiagram
class UserService {
  +login(username, password)
}
class UserRepository {
  +findByName(name)
}
UserService --> UserRepository`,
  },
  {
    id: 'er',
    label: 'ER（实体关系）',
    code: `erDiagram
USER ||--o{ ORDER : places
ORDER ||--|{ ORDER_ITEM : contains
PRODUCT ||--o{ ORDER_ITEM : referenced_by`,
  },
  {
    id: 'flowchart',
    label: 'Flowchart（流程图）',
    code: `flowchart TD
A[开始] --> B{条件判断}
B -->|是| C[执行方案A]
B -->|否| D[执行方案B]
C --> E[结束]
D --> E`,
  },
  {
    id: 'gantt',
    label: 'Gantt（甘特图）',
    code: `gantt
title 项目排期
dateFormat  YYYY-MM-DD
section 开发
需求分析 :done, a1, 2026-04-01, 3d
编码实现 :active, a2, after a1, 5d
联调测试 : a3, after a2, 4d`,
  },
  {
    id: 'git',
    label: 'Git（分支图）',
    code: `gitGraph
commit
commit
branch develop
checkout develop
commit
commit
checkout main
merge develop
commit`,
  },
  {
    id: 'kanban',
    label: 'Kanban（看板）',
    code: `kanban
Todo
  [梳理需求]
Doing
  [开发中]
Done
  [已上线]`,
  },
  {
    id: 'mindmap',
    label: 'Mindmap（思维导图）',
    code: `mindmap
  root((产品需求))
    用户端
      登录
      查询
    管理端
      审核
      报表`,
  },
  {
    id: 'packet',
    label: 'Packet（报文图）',
    code: `packet-beta
0-7: "Version"
8-15: "Type"
16-31: "Length"
32-63: "Payload"`,
  },
  {
    id: 'pie',
    label: 'Pie（饼图）',
    code: `pie title 访问来源
"直接访问" : 45
"搜索引擎" : 30
"外部链接" : 25`,
  },
  {
    id: 'quadrant',
    label: 'Quadrant（象限图）',
    code: `quadrantChart
title 需求优先级
x-axis 低投入 --> 高投入
y-axis 低收益 --> 高收益
quadrant-1 重点投入
quadrant-2 战略观察
quadrant-3 快速执行
quadrant-4 低优先级
"登录优化": [0.3, 0.8]
"风格换肤": [0.7, 0.4]`,
  },
  {
    id: 'requirement',
    label: 'Requirement（需求图）',
    code: `requirementDiagram
    requirement req_login {
        id: 1
        text: the test text
        risk: high
        verifymethod: test
    }
    element frontend {
        type: ui
        docRef: "登录页"
    }
    frontend - satisfies -> req_login`,
  },
  {
    id: 'sankey',
    label: 'Sankey（桑基图）',
    code: `sankey-beta
研发,后端,40
研发,前端,30
研发,测试,20
研发,运维,10`,
  },
  {
    id: 'sequence',
    label: 'Sequence（时序图）',
    code: `sequenceDiagram
participant U as 用户
participant F as 前端
participant B as 后端
U->>F: 提交登录
F->>B: 调用认证接口
B-->>F: 返回结果
F-->>U: 显示状态`,
  },
  {
    id: 'state',
    label: 'State（状态图）',
    code: `stateDiagram
[*] --> Still
Still --> Moving
Moving --> Crash
Crash --> [*]`,
  },
  {
    id: 'timeline',
    label: 'Timeline（时间线）',
    code: `timeline
title 版本里程碑
2026-01 : 需求冻结
2026-02 : 开发完成
2026-03 : 发布上线`,
  },
  {
    id: 'xy',
    label: 'XY（坐标图）',
    code: `xychart-beta
title "月活趋势"
x-axis [1, 2, 3, 4, 5]
y-axis "用户数" 0 --> 100
line [18, 32, 46, 72, 90]`,
  },
]

function normalizeLine(line?: number): number | null {
  if (typeof line !== 'number' || Number.isNaN(line)) {
    return null
  }
  return line >= 1 ? line : line + 1
}

function normalizeColumn(column?: number): number | null {
  if (typeof column !== 'number' || Number.isNaN(column)) {
    return null
  }
  return column >= 1 ? column : column + 1
}

function buildCodeFrame(source: string, line: number | null, column: number | null): string {
  if (!line) {
    return '无法定位到具体行，请检查 Mermaid 语法。'
  }

  const lines = source.split('\n')
  const start = Math.max(1, line - 1)
  const end = Math.min(lines.length, line + 1)
  const frame: string[] = []

  for (let current = start; current <= end; current += 1) {
    const prefix = current === line ? '>' : ' '
    frame.push(`${prefix} ${String(current).padStart(3, ' ')} | ${lines[current - 1] ?? ''}`)
    if (current === line && column) {
      frame.push(`    ${' '.repeat(3)} | ${' '.repeat(Math.max(0, column - 1))}^`)
    }
  }

  return frame.join('\n')
}

function buildProfessionalErrorMessage(source: string, error: unknown, parseHash: MermaidParseHash | null): string {
  const rawMessage = error instanceof Error ? error.message : String(error)
  const line = normalizeLine(parseHash?.loc?.first_line ?? parseHash?.line)
  const column = normalizeColumn(parseHash?.loc?.first_column)
  const token = parseHash?.token ? `\n- 当前 Token: ${parseHash.token}` : ''
  const expected = parseHash?.expected?.length
    ? `\n- 期望 Token: ${parseHash.expected.slice(0, 8).join(', ')}`
    : ''

  return [
    'Mermaid 编译失败',
    '----------------------------------------',
    '- 支持策略: 按 Mermaid 引擎内置图表类型自动识别与编译',
    `- 错误位置: ${line ? `第 ${line} 行` : '未知行'}${column ? `, 第 ${column} 列` : ''}`,
    `${token}${expected}`,
    '',
    '代码上下文：',
    buildCodeFrame(source, line, column),
    '',
    '原始错误：',
    rawMessage,
  ]
    .join('\n')
    .replace('\n\n- 当前 Token', '\n- 当前 Token')
    .replace('\n\n- 期望 Token', '\n- 期望 Token')
}

function ensureWhiteBackground(svg: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svg, 'image/svg+xml')
  const svgEl = doc.documentElement
  if (!svgEl || svgEl.tagName.toLowerCase() !== 'svg') {
    return svg
  }

  svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  let backgroundRect = svgEl.querySelector<SVGRectElement>('#mf-white-bg')
  if (!backgroundRect) {
    backgroundRect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
    backgroundRect.setAttribute('id', 'mf-white-bg')
    backgroundRect.setAttribute('x', '0')
    backgroundRect.setAttribute('y', '0')
    backgroundRect.setAttribute('width', '100%')
    backgroundRect.setAttribute('height', '100%')
    backgroundRect.setAttribute('fill', '#ffffff')
    svgEl.insertBefore(backgroundRect, svgEl.firstChild)
  }

  return new XMLSerializer().serializeToString(svgEl)
}

function getSvgBaseSize(svgEl: SVGSVGElement): { width: number; height: number } | null {
  const viewBox = svgEl.viewBox?.baseVal
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height }
  }

  const attrWidth = Number(svgEl.getAttribute('width'))
  const attrHeight = Number(svgEl.getAttribute('height'))
  if (Number.isFinite(attrWidth) && Number.isFinite(attrHeight) && attrWidth > 0 && attrHeight > 0) {
    return { width: attrWidth, height: attrHeight }
  }

  return null
}

function getSvgContentBox(svgEl: SVGSVGElement): { x: number; y: number; width: number; height: number } | null {
  try {
    const box = svgEl.getBBox()
    if (Number.isFinite(box.width) && Number.isFinite(box.height) && box.width > 0 && box.height > 0) {
      return { x: box.x, y: box.y, width: box.width, height: box.height }
    }
  } catch {
    // 某些场景 getBBox 可能抛错，降级走基础尺寸逻辑。
  }
  return null
}

function App() {
  const [source, setSource] = useState(INITIAL_SOURCE)
  const [svg, setSvg] = useState('')
  const [renderError, setRenderError] = useState('')
  const [diagramType, setDiagramType] = useState('flowchart')
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [status, setStatus] = useState('就绪')
  const [selectedTemplate, setSelectedTemplate] = useState(MERMAID_TEMPLATES[0].id)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ x: 0, y: 0, originX: 0, originY: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const parseErrorRef = useRef<MermaidParseHash | null>(null)
  const baseSizeRef = useRef<{ width: number; height: number } | null>(null)
  const contentBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'base',
      themeVariables: {
        primaryColor: '#ffffff',
        primaryBorderColor: '#000000',
        primaryTextColor: '#000000',
        lineColor: '#000000',
        tertiaryColor: '#f8fafc',
        // Git 图像素级配色（贴近 mermaid.ai 视觉）：主干深蓝、develop 青绿、次分支高对比。
        git0: '#1f2348',
        git1: '#25d9d2',
        git2: '#ff9f43',
        git3: '#a78bfa',
        git4: '#38bdf8',
        git5: '#34d399',
        git6: '#fb7185',
        git7: '#9ca3af',
        gitInv0: '#ffffff',
        gitInv1: '#ffffff',
        gitInv2: '#ffffff',
        gitInv3: '#ffffff',
        gitInv4: '#ffffff',
        gitInv5: '#ffffff',
        gitInv6: '#ffffff',
        gitInv7: '#ffffff',
        branchLabelColor: '#0b1029',
        gitBranchLabel0: '#ffffff',
        gitBranchLabel1: '#ff9f43',
        gitBranchLabel2: '#fcd34d',
        gitBranchLabel3: '#ddd6fe',
        gitBranchLabel4: '#bae6fd',
        gitBranchLabel5: '#bbf7d0',
        gitBranchLabel6: '#fecdd3',
        gitBranchLabel7: '#e5e7eb',
        tagLabelColor: '#ffffff',
        tagLabelBackground: '#1f2348',
        tagLabelBorder: '#1f2348',
        commitLabelColor: '#111827',
        commitLabelBackground: '#ffffff',
        commitLabelFontSize: '16px',
        tagLabelFontSize: '12px',
        fontFamily: 'Microsoft YaHei, Segoe UI, SimHei, Arial, sans-serif',
        fontSize: '14px',
      },
      // 继续使用纯 SVG 文本标签，避免导出出现空框和文本丢失。
      flowchart: { htmlLabels: false, useMaxWidth: false, padding: 15, curve: 'basis' },
      // Git 图启用并行提交布局，标签展示更接近专业代码托管平台视觉。
      gitGraph: {
        mainBranchName: 'main',
        showCommitLabel: true,
        showBranches: true,
        parallelCommits: true,
        rotateCommitLabel: true,
      },
    })

    // 接管 Mermaid 解析错误回调，提取行号与 token 细节用于专业错误提示。
    mermaid.setParseErrorHandler((_err, hash) => {
      parseErrorRef.current = (hash ?? null) as MermaidParseHash | null
    })
  }, [])

  const fitPreviewToCanvas = () => {
    const canvasEl = canvasRef.current
    const svgEl = previewRef.current?.querySelector('svg')
    if (!canvasEl || !svgEl) {
      return
    }

    const baseSize = getSvgBaseSize(svgEl)
    if (!baseSize) {
      return
    }

    baseSizeRef.current = baseSize
    contentBoxRef.current = getSvgContentBox(svgEl)
    const padding = 36
    const availableWidth = Math.max(80, canvasEl.clientWidth - padding * 2)
    const availableHeight = Math.max(80, canvasEl.clientHeight - padding * 2)
    const targetBox = contentBoxRef.current ?? { x: 0, y: 0, width: baseSize.width, height: baseSize.height }
    const fitScale = Math.min(availableWidth / targetBox.width, availableHeight / targetBox.height)
    // 放宽上限，小图可自动放大到更接近商业软件显示效果。
    const nextZoom = Math.min(6, Math.max(0.3, fitScale))

    const centeredX = Math.round((canvasEl.clientWidth - targetBox.width * nextZoom) / 2 - targetBox.x * nextZoom)
    const centeredY = Math.round((canvasEl.clientHeight - targetBox.height * nextZoom) / 2 - targetBox.y * nextZoom)

    setZoom(nextZoom)
    setOffsetX(centeredX)
    setOffsetY(centeredY)
  }

  useEffect(() => {
    const svgEl = previewRef.current?.querySelector('svg')
    if (!svgEl) {
      return
    }

    const baseSize = baseSizeRef.current ?? getSvgBaseSize(svgEl)
    if (baseSize) {
      svgEl.setAttribute('width', `${Math.max(1, Math.round(baseSize.width * zoom))}`)
      svgEl.setAttribute('height', `${Math.max(1, Math.round(baseSize.height * zoom))}`)
    }
  }, [svg, zoom])

  useEffect(() => {
    if (!svg) {
      return
    }

    const timer = window.setTimeout(() => {
      fitPreviewToCanvas()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [svg])

  useEffect(() => {
    const onResize = () => {
      if (!svg || renderError) {
        return
      }
      fitPreviewToCanvas()
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [svg, renderError])

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      // 源码为空时不进行编译，交由模板下拉引导用户快速创建图表。
      if (!source.trim()) {
        setSvg('')
        setRenderError('')
        setDiagramType('未选择')
        return
      }

      try {
        parseErrorRef.current = null
        // 自动识别 Mermaid 图表类型，支持 flowchart/sequence/gantt/gitGraph 等多种语法。
        const detectedType = mermaid.detectType(source)
        await mermaid.parse(source, { suppressErrors: false })
        const renderId = `mf-${Date.now()}`
        const result = await mermaid.render(renderId, source)
        setSvg(result.svg)
        setDiagramType(detectedType)
        setRenderError('')
      } catch (error) {
        setSvg('')
        baseSizeRef.current = null
        contentBoxRef.current = null
        setDiagramType('未识别')
        const fallbackHash = (error as { hash?: MermaidParseHash })?.hash ?? null
        const errorMessage = buildProfessionalErrorMessage(source, error, parseErrorRef.current ?? fallbackHash)
        setRenderError(errorMessage)
      }
    }, 60)
    return () => window.clearTimeout(timeoutId)
  }, [source])

  const exportPng = async () => {
    if (!svg) {
      setStatus('当前没有可导出的图形')
      return
    }

    const currentSvg = previewRef.current?.querySelector('svg')?.outerHTML ?? svg
    const whiteBgSvg = ensureWhiteBackground(currentSvg)

    try {
      setIsExporting(true)
      const savedPath = await invoke<string>('export_png_with_dialog', { svg: whiteBgSvg })
      setStatus(`导出完成: ${savedPath}`)
    } catch (error) {
      const message = String(error)
      if (message.includes('用户取消导出')) {
        setStatus('已取消导出')
      } else {
        setStatus(`导出失败: ${message}`)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const loadTemplate = (templateId: string) => {
    const template = MERMAID_TEMPLATES.find((item) => item.id === templateId)
    if (!template) {
      return
    }
    setSource(template.code)
    setStatus(`已加载模板: ${template.label}`)
  }

  return (
    <div className="app-shell">
      <header className="toolbar">
        <div className="title">Mermaid Flow Pro</div>
        <div className="toolbar-actions">
          <button
            type="button"
            onClick={() => {
              fitPreviewToCanvas()
            }}
          >
            重置视图
          </button>
          <button type="button" onClick={exportPng} disabled={isExporting}>
            {isExporting ? '导出中...' : '导出 PNG'}
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="editor-pane">
          <div className="pane-title">Mermaid 源码</div>
          <div className="editor-content">
            {source.trim().length === 0 ? (
              <div className="template-picker">
                <select
                  value={selectedTemplate}
                  onChange={(event) => {
                    const templateId = event.target.value
                    setSelectedTemplate(templateId)
                    loadTemplate(templateId)
                  }}
                >
                  <option value="">选择图表模板...</option>
                  {MERMAID_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <Editor
              height="100%"
              defaultLanguage="markdown"
              language="markdown"
              value={source}
              onChange={(value) => setSource(value ?? '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                smoothScrolling: true,
                wordWrap: 'on',
                tabSize: 2,
                automaticLayout: true,
              }}
            />
          </div>
        </section>

        <section className="preview-pane">
          <div className="pane-title">
            实时预览（白底导出，所见即所得） | 当前类型：{diagramType}
            <span className="status">{status}</span>
          </div>
          <div
            ref={canvasRef}
            className="canvas"
            onWheel={(event) => {
              event.preventDefault()
              const delta = event.deltaY > 0 ? -0.08 : 0.08
              setZoom((prev) => Math.min(8, Math.max(0.3, prev + delta)))
            }}
            onMouseDown={(event) => {
              setDragging(true)
              dragRef.current = {
                x: event.clientX,
                y: event.clientY,
                originX: offsetX,
                originY: offsetY,
              }
            }}
            onMouseMove={(event) => {
              if (!dragging) {
                return
              }
              const dx = event.clientX - dragRef.current.x
              const dy = event.clientY - dragRef.current.y
              // 使用整数平移，降低亚像素抗锯齿带来的字体虚化。
              setOffsetX(Math.round(dragRef.current.originX + dx))
              setOffsetY(Math.round(dragRef.current.originY + dy))
            }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
          >
            {renderError ? (
              <pre className="error-panel">{renderError}</pre>
            ) : (
              <div
                ref={previewRef}
                className="svg-stage"
                style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
