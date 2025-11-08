import { GoogleGenAI } from "@google/genai";
import { BusinessData } from '../types';

// IMPORTANT: The API key is sourced from an environment variable.
// Do not modify this line. The build environment is responsible for providing `process.env.API_KEY`.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const fetchBusinesses = async (
  country: string,
  state: string,
  city: string,
  sector: string
): Promise<BusinessData[]> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Com base no Google Maps, encontre aproximadamente 50 empresas do setor '${sector}' na cidade de '${city}', estado de '${state}', '${country}'.

    Sua tarefa é focar em contatos que seriam úteis para uma agência de marketing digital. Portanto, dê preferência para:
    1.  Pequenas empresas e negócios locais.
    2.  Empresas com poucas avaliações (baixa contagem de estrelas) no Google Meu Negócio.
    3.  Empresas que parecem ter uma presença digital fraca.

    Para cada empresa, extraia as seguintes informações:
    - nome: O nome completo da empresa.
    - whatsapp: O número de telefone de contato, priorizando números de WhatsApp ou celular. Se não houver, pode deixar em branco.
    - websiteStatus: Analise se a empresa possui um site.
        - Se encontrar um site, avalie-o brevemente. Se parecer amador, desatualizado, quebrado ou não for responsivo (não funciona bem em celulares), classifique como "Site Ruim".
        - Se não encontrar um site listado no Google Maps, classifique como "Não Tem Site".

    Retorne os resultados em um formato de array JSON. O JSON deve ser a única coisa na sua resposta. Não adicione nenhum texto de introdução ou conclusão.

    Exemplo de formato de resposta:
    [
      {
        "nome": "Restaurante Sabor Caseiro",
        "whatsapp": "+55 11 91234-5678",
        "websiteStatus": "Não Tem Site"
      },
      {
        "nome": "Pet Shop Cão Feliz",
        "whatsapp": "+55 11 98765-4321",
        "websiteStatus": "Site Ruim"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text.trim();
    
    // Robust JSON extraction
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']');

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("Resposta da API não contém um array JSON:", text);
      throw new Error("Não foi possível encontrar dados de empresas. A resposta da API pode ter mudado de formato.");
    }

    const jsonString = text.substring(jsonStart, jsonEnd + 1);

    try {
      const parsedData = JSON.parse(jsonString);
      if (Array.isArray(parsedData)) {
        // Filter out any entries that might be incomplete from the API
        return parsedData.filter(item => item.nome && item.websiteStatus) as BusinessData[];
      } else {
        throw new Error("O JSON extraído não é um array.");
      }
    } catch (parseError) {
      console.error("Erro ao analisar JSON da resposta da API:", parseError, "String JSON:", jsonString);
      throw new Error("Ocorreu um erro ao processar os dados recebidos.");
    }

  } catch (error) {
    console.error("Erro ao chamar a API Gemini:", error);
    throw new Error("Falha ao buscar empresas. Verifique sua chave de API e a conexão.");
  }
};
