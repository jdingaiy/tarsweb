/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SectorConfig } from './types';

export const SECTORS_DATA: Record<string, SectorConfig> = {
  algorithm: {
    id: 'algorithm',
    name: '超级算法',
    icon: 'BrainCircuit',
    title: 'Super Algorithm Engine',
    subtitle: '多模态混合专家架构 & 动态推理自适应路由',
    description: '深度优化的超级计算框架，结合多模型协同演化算法，以极低延迟处理超高纬度决策流，支撑物理仿真与大模型融合计算。',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    details: {
      specs: [
        '算法效率提升：+420% 推理加速',
        '模型参数：自适应 2.5T MoE 混合专家模型',
        '核心引擎：Aether-Flow 4.0 超导矩阵编译器',
        '并发吞吐量：150k+/秒 并行深度推理'
      ],
      capabilities: [
        '动态推理路由 (Dynamic Inference Routing)',
        '零样本跨域少样本迁移学习',
        '多模态流式时序感知强化算法',
        '极深残差神经算子网络 (Neural Operators)'
      ],
      benchmarks: [
        { label: '多任务泛化 MMLU', value: '94.8%' },
        { label: '代码生成 Pass@1', value: '88.2%' },
        { label: '能耗优化比率', value: '-65%' }
      ],
      useCases: [
        '跨洲物理级高保真天气仿真系统',
        '千亿规模自动微处理器架构协同设计',
        '自主型无人空中运输编队集群对抗调度'
      ]
    },
    gridPosition: 'md:col-start-2 md:row-start-3'
  },
  ontology: {
    id: 'ontology',
    name: '超级本体',
    icon: 'Cpu',
    title: 'Super Ontology Platform',
    subtitle: '物理具身智能先验知识图谱与动态具身映射',
    description: '构建连接数字世界与物理客观实体的“超级概念神经图谱”。拥有两百亿实体关系对，为机器人及智联传感器提供无缝物理规则常识。',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
    details: {
      specs: [
        '实体规模：260 亿常识知识节点',
        '图谱流刷新率：3kHz 实时间隔更新',
        '时空关联度：物理动力学先验高精度闭环',
        '设备适配：超 40 种主流具身执行器架构'
      ],
      capabilities: [
        '物理定律流式嵌入与动力学先验',
        '三维跨物料场景常识语义重构',
        '语义图谱秒级热插拔学习机制',
        '因果关系推理引擎 (Causal Reasoning Engine)'
      ],
      benchmarks: [
        { label: '空间实体检索延迟', value: '1.2ms' },
        { label: '常识推理准确率', value: '96.5%' },
        { label: '具身机器人迁移收敛', value: '15 Mins' }
      ],
      useCases: [
        '工业级多轴自由度协作机械臂极速自适应部署',
        '仓储无人化重载全向 AGV 多约束避障场景',
        '全生命周期数字孪生智慧微网状态智能进化'
      ]
    },
    gridPosition: 'md:col-start-8 md:row-start-1'
  },
  application: {
    id: 'application',
    name: '超级应用',
    icon: 'Blocks',
    title: 'Super Application Suite',
    subtitle: '端到端自主零代码认知工作流与协同控制系统',
    description: '无需开发直接承载大规模智能决策。为多终端、跨平台场景提供流式智能面板、自动化决策中枢与全时空间投影。',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    details: {
      specs: [
        '工作流执行：自主执行率达 99.1%',
        '连接触点：支持 1,500+ 全场景系统与软硬件接口',
        '响应时效：端到端感知决策低于 8ms',
        '全时空间：多端分布式原子化界面渲染'
      ],
      capabilities: [
        '全局智能状态追踪与自适应 UI 调变',
        '安全隔离式 AI Sandbox 本地环境执行',
        '高维复杂任务多路分形解构并发执行',
        '跨场景传感器实时编排与协同合成'
      ],
      benchmarks: [
        { label: '自动流程编排成功度', value: '98.9%' },
        { label: '多主代理协同规模', value: '10,000+ Nodes' },
        { label: '人机无缝接管时差', value: '4ms' }
      ],
      useCases: [
        '全温区智能化数字物流港自主装卸调度',
        '多地异构研发中心数字资产 AI 智能质检与并合',
        '全场景分布式多系统流程超高频全链自动巡检'
      ]
    },
    gridPosition: 'md:col-start-7 md:row-start-5'
  }
};
