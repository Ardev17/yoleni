/**
 * ============================================================
 * Yoleni Chemical AI - Prompt Engine
 * Motor de prompts para análise química via OpenAI
 * ============================================================
 */

/**
 * Gera o prompt principal para análise de substâncias químicas.
 * @param {string[]} substances - Lista de substâncias a analisar
 * @returns {string} Prompt formatado para a OpenAI
 */
const buildChemicalAnalysisPrompt = (substances) => {
  const substanceList = substances.join(', ');

  return `Você é um sistema especializado de análise química chamado "Yoleni Chemical AI". 
Sempre comece sua resposta com "Olá Yoleni," seguido de uma saudação calorosa e profissional.

Analise as seguintes substâncias químicas: ${substanceList}

Retorne EXCLUSIVAMENTE um JSON válido (sem markdown, sem texto antes ou depois do JSON) com a seguinte estrutura:

{
  "greeting": "Olá Yoleni, [mensagem personalizada e calorosa sobre a análise]",
  "substances": [
    {
      "name": "Nome da substância",
      "formula": "Fórmula química",
      "chemical_function": "Função química (ex: Ácido, Base, Sal, Óxido, etc.)",
      "properties": "Propriedades físico-químicas principais",
      "industrial_application": "Principais aplicações industriais",
      "environmental_impact": "baixo|moderado|alto|crítico",
      "environmental_details": "Detalhes sobre impacto ambiental",
      "estimated_cost": "Custo estimado por kg em USD",
      "pollution_level": "baixo|moderado|alto|crítico",
      "maintenance_time": "Tempo médio de manutenção de equipamentos",
      "possible_combinations": ["combinação 1", "combinação 2"]
    }
  ],
  "suggested_processes": [
    {
      "process_name": "Nome do processo",
      "type": "optimized|low_cost|eco_friendly",
      "reagents": ["reagente 1", "reagente 2"],
      "description": "Descrição detalhada do processo",
      "estimated_efficiency": "XX%",
      "estimated_cost": "Faixa de custo",
      "environmental_impact": "baixo|moderado|alto",
      "industrial_recommendation": "Recomendação técnica detalhada para a Engenheira Yoleni",
      "advantages": ["vantagem 1", "vantagem 2"],
      "warnings": ["atenção 1", "atenção 2"]
    }
  ],
  "summary": {
    "total_substances": ${substances.length},
    "safest_combination": "Combinação mais segura identificada",
    "most_efficient_process": "Processo mais eficiente identificado",
    "environmental_recommendation": "Recomendação geral de sustentabilidade",
    "cost_optimization": "Dica de otimização de custos para Yoleni"
  }
}

Seja preciso, técnico e use dados reais da química industrial. Todos os valores devem ser baseados em dados científicos reais.`;
};

/**
 * Gera prompt para análise de arquivo CSV/Excel
 * @param {string[]} substances - Substâncias extraídas do arquivo
 * @param {string} filename - Nome do arquivo
 * @returns {string}
 */
const buildFileAnalysisPrompt = (substances, filename) => {
  return buildChemicalAnalysisPrompt(substances) + `\n\nEsses dados foram importados do arquivo: ${filename}. Mencione isso na saudação.`;
};

module.exports = {
  buildChemicalAnalysisPrompt,
  buildFileAnalysisPrompt,
};
