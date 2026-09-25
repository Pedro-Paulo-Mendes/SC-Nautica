function redimensionarImagemCarregada(img, larguraMaxima, qualidade) {
  const escala = Math.min(1, larguraMaxima / img.width);
  const largura = Math.round(img.width * escala);
  const altura = Math.round(img.height * escala);
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  canvas.getContext('2d').drawImage(img, 0, 0, largura, altura);
  return canvas.toDataURL('image/jpeg', qualidade);
}

export function lerImagemRedimensionada(arquivo, larguraMaxima = 900, qualidade = 0.75) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo de imagem.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo inválido, não parece ser uma imagem.'));
      img.onload = () => resolve(redimensionarImagemCarregada(img, larguraMaxima, qualidade));
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

export function redimensionarDataUrl(dataUrl, larguraMaxima = 900, qualidade = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem baixada.'));
    img.onload = () => resolve(redimensionarImagemCarregada(img, larguraMaxima, qualidade));
    img.src = dataUrl;
  });
}
