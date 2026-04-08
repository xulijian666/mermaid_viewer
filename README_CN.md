# Mermaid 图表查看器

一个基于 React + TypeScript + Vite + Tauri 构建的 Mermaid 图表编辑和预览工具。

## 功能特性

- **实时预览**：编辑 Mermaid 代码时实时渲染图表
- **多种图表支持**：支持流程图、时序图、类图、状态图、ER图、甘特图等 20+ 种图表类型
- **模板库**：内置丰富的图表模板，快速上手
- **代码编辑器**：集成 Monaco Editor，提供语法高亮和错误提示
- **错误诊断**：实时检测 Mermaid 语法错误并定位问题
- **导出功能**：支持导出 PNG 图片
- **桌面应用**：基于 Tauri 构建的轻量级桌面应用

## 技术栈

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite 8
- **桌面应用**：Tauri 2
- **代码编辑器**：Monaco Editor
- **图表渲染**：Mermaid 11
- **代码质量**：ESLint + TypeScript ESLint

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 构建 Tauri 桌面应用

```bash
npm run tauri:build
```

## 支持的图表类型

- Flowchart（流程图）
- Sequence Diagram（时序图）
- Class Diagram（类图）
- State Diagram（状态图）
- Entity Relationship Diagram（ER图）
- User Journey（用户旅程图）
- Gantt（甘特图）
- Pie Chart（饼图）
- Quadrant Chart（象限图）
- Requirement Diagram（需求图）
- Gitgraph（Git 图）
- C4 Diagram（C4 架构图）
- Mindmap（思维导图）
- Timeline（时间线）
- Architecture Diagram（架构图）
- Block Diagram（块图）
- Packet Diagram（数据包图）
- Sankey Diagram（桑基图）
- XY Chart（XY 图表）
- 以及更多...

## 项目结构

```
mermaid_viewer/
├── src/
│   ├── App.tsx          # 主应用组件
│   ├── App.css          # 样式文件
│   └── main.tsx         # 入口文件
├── public/              # 静态资源
├── src-tauri/           # Tauri 后端代码
├── package.json         # 项目配置
└── vite.config.ts       # Vite 配置
```

## 开发说明

### React Compiler

本项目启用了 React Compiler 以优化性能。了解更多信息请参阅 [React Compiler 文档](https://react.dev/learn/react-compiler)。

注意：这会影响 Vite 开发和构建性能。

### ESLint 配置扩展

如果你正在开发生产应用，建议更新配置以启用类型感知的 lint 规则：

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // 其他配置...

      // 移除 tseslint.configs.recommended 并替换为此配置
      tseslint.configs.recommendedTypeChecked,
      // 或者使用更严格的规则
      tseslint.configs.strictTypeChecked,
      // 可选：添加样式规则
      tseslint.configs.stylisticTypeChecked,

      // 其他配置...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // 其他选项...
    },
  },
])
```

你也可以安装 [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) 和 [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) 以获得 React 特定的 lint 规则：

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // 其他配置...
      // 启用 React lint 规则
      reactX.configs['recommended-typescript'],
      // 启用 React DOM lint 规则
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // 其他选项...
    },
  },
])
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！