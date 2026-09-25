export const CAMPOS_POR_CATEGORIA = {
  motor: [
    { chave: 'potencia_hp', rotulo: 'Potência (HP)', tipo: 'number' },
    { chave: 'numero_serie', rotulo: 'Número de série', tipo: 'text' },
    { chave: 'ciclo', rotulo: 'Ciclo', tipo: 'select', opcoes: ['2 tempos', '4 tempos'] },
    { chave: 'combustivel', rotulo: 'Combustível', tipo: 'select', opcoes: ['Gasolina', 'Diesel', 'Elétrico'] }
  ],
  barco: [
    { chave: 'numero_casco', rotulo: 'Número do casco', tipo: 'text' },
    { chave: 'comprimento_pes', rotulo: 'Comprimento (pés)', tipo: 'number' },
    { chave: 'capacidade_pessoas', rotulo: 'Capacidade (pessoas)', tipo: 'number' },
    { chave: 'material', rotulo: 'Material', tipo: 'select', opcoes: ['Fibra', 'Alumínio', 'Inflável'] }
  ],
  carreta: [
    { chave: 'capacidade_kg', rotulo: 'Capacidade (kg)', tipo: 'number' },
    { chave: 'numero_eixos', rotulo: 'Número de eixos', tipo: 'number' },
    { chave: 'tipo_carreta', rotulo: 'Tipo', tipo: 'select', opcoes: ['Rodoviária', 'Náutica'] }
  ]
};
