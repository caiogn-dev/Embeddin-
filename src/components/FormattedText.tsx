import React from 'react';
import DOMPurify from 'dompurify';

// Função para formatar o texto de forma amigável
const formatResponseText = (text: string): React.ReactNode => {
  let displayText = text;

  // Tentar extrair o campo 'result' se for um JSON-like
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      // Substituir aspas simples por duplas para tentar parsear
      const fixedJson = text.replace(/'/g, '"');
      const parsed = JSON.parse(fixedJson);
      if (parsed && typeof parsed === 'object' && 'result' in parsed) {
        displayText = parsed.result;
      }
    } catch (e) {
      console.warn('Falha ao parsear texto como JSON:', e);
    }
  }

  // Função para converter texto com marcação em HTML
  const convertToHTML = (text: string): string => {
    let formatted = text;

    // Substituir quebras de linha duplas por parágrafos
    formatted = formatted.replace(/\n\n/g, '</p><p>');

    // Substituir quebras de linha simples por <br />
    formatted = formatted.replace(/\n/g, '<br />');

    // Substituir marcações de título
    formatted = formatted.replace(/^###\s(.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^####\s(.+)$/gm, '<h4>$1</h4>');

    // Substituir listas (- item) por <ul><li>
    const listRegex = /^((\s*- .+?)+)$/gm;
    formatted = formatted.replace(listRegex, (match) => {
      const items = match.split('\n').filter(line => line.trim().startsWith('- '));
      const listItems = items.map(item => `<li>${item.substring(2).trim()}</li>`).join('');
      return `<ul>${listItems}</ul>`;
    });

    // Substituir negrito (**texto**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Substituir itálico (*texto*)
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Substituir código inline (`code`)
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Envolver o texto em um parágrafo se não for outro elemento
    if (!formatted.startsWith('<h') && !formatted.startsWith('<ul') && !formatted.startsWith('<p')) {
      formatted = `<p>${formatted}</p>`;
    }

    return formatted;
  };

  // Converter o texto em HTML
  const htmlContent = convertToHTML(displayText);

  // Sanitizar o HTML para evitar XSS
  const safeHtml = DOMPurify.sanitize(htmlContent);

  // Retornar o conteúdo formatado com CSS inline
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.6',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        color: '#333',
      }}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};

// Estilos CSS adicionais (recomendo mover para um arquivo .css)
const styles = `
  h3 {
    color: #2c3e50;
    margin-top: 20px;
    font-size: 1.5em;
  }
  h4 {
    color: #34495e;
    margin-top: 15px;
    font-size: 1.2em;
  }
  ul {
    list-style-type: disc;
    margin: 10px 0;
    padding-left: 20px;
  }
  li {
    margin-bottom: 5px;
  }
  p {
    margin: 10px 0;
  }
  strong {
    font-weight: 700;
  }
  em {
    font-style: italic;
  }
  code {
    background-color: #f4f4f4;
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
  }
`;

// Componente React para renderizar o texto formatado
interface FormattedTextProps {
  text: string;
}

const FormattedText: React.FC<FormattedTextProps> = ({ text }) => {
  return (
    <>
      <style>{styles}</style>
      {formatResponseText(text)}
    </>
  );
};

export default FormattedText;