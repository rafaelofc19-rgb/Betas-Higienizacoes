from src.models.user import db
from datetime import datetime

class Servico(db.Model):
    __tablename__ = 'servicos'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text)
    categoria = db.Column(db.String(50), nullable=False)
    tempo_estimado = db.Column(db.Integer, nullable=False)  # em minutos
    preco_base = db.Column(db.Float, nullable=False)
    custo_mao_obra = db.Column(db.Float, nullable=False)
    custo_materiais = db.Column(db.Float, nullable=False, default=0)
    margem_lucro_percentual = db.Column(db.Float, nullable=False, default=30)
    preco_final = db.Column(db.Float, nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ativo = db.Column(db.Boolean, default=True)
    
    def calcular_preco_final(self):
        custo_total = self.custo_mao_obra + self.custo_materiais
        self.preco_final = custo_total * (1 + self.margem_lucro_percentual / 100)
        return self.preco_final
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'categoria': self.categoria,
            'tempo_estimado': self.tempo_estimado,
            'preco_base': self.preco_base,
            'custo_mao_obra': self.custo_mao_obra,
            'custo_materiais': self.custo_materiais,
            'margem_lucro_percentual': self.margem_lucro_percentual,
            'preco_final': self.preco_final,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None,
            'ativo': self.ativo
        }

