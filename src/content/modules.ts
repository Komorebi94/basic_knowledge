import type { ModuleId } from './types'

export type ModuleMeta = {
    id: ModuleId
    label: string
    description: string
    accent: string
}

export const MODULES: ModuleMeta[] = [
    {
        id: 'react',
        label: 'React',
        description: '渲染机制、状态、Hooks、性能与服务端渲染',
        accent: '#7dd3fc',
    },
    {
        id: 'vue',
        label: 'Vue',
        description: '响应式、组件通信、生命周期与状态管理',
        accent: '#86efac',
    },
    {
        id: 'javascript',
        label: 'JavaScript',
        description: '类型、作用域、原型、异步与语言运行时',
        accent: '#fde68a',
    },
    {
        id: 'browser',
        label: '浏览器',
        description: '网络链路、加载渲染、性能、安全与存储',
        accent: '#93c5fd',
    },
    {
        id: 'typescript',
        label: 'TypeScript',
        description: '类型建模、泛型、收窄与运行时边界',
        accent: '#67e8f9',
    },
    {
        id: 'css',
        label: 'CSS',
        description: '盒模型、层叠、布局、响应式与现代 CSS',
        accent: '#f9a8d4',
    },
    {
        id: 'engineering',
        label: '工程化',
        description: '构建、模块化、测试、发布、监控与 Monorepo',
        accent: '#fdba74',
    },
    {
        id: 'handwriting',
        label: '手写题',
        description: '异步控制、数据转换与常见工程实现',
        accent: '#c4b5fd',
    },
    {
        id: 'ai',
        label: 'AI',
        description: 'LLM 原理、AI 编程、前端架构、交互、RAG、Agent、测试与安全',
        accent: '#e8b84a',
    },
]

export function getModule(id: ModuleId): ModuleMeta {
    const found = MODULES.find((item) => item.id === id)
    if (!found) {
        throw new Error(`Unknown module: ${id}`)
    }
    return found
}
