from flask import Blueprint, request, jsonify
from src.models.servico import Servico, db
from datetime import datetime

servicos_bp = Blueprint('servicos', __name__)

@servicos_bp.route('/servicos', methods=['GET'])
def listar_servicos():
    try:
        servicos = Servico.query.filter_by(ativo=True).all()
        return jsonify([servico.to_dict() for servico in servicos])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@servicos_bp.route('/servicos', methods=['POST'])
def criar_servico():
    try:
        data = request.get_json()
        
        servico = Servico(
            nome=data['nome'],
            descricao=data.get('descricao', ''),
            categoria=data['categoria'],
            tempo_estimado=int(data['tempo_estimado']),
            preco_base=float(data.get('preco_base', 0)),
            custo_mao_obra=float(data['custo_mao_obra']),
            custo_materiais=float(data.get('custo_materiais', 0)),
            margem_lucro_percentual=float(data.get('margem_lucro_percentual', 30))
        )
        
        # Calcular preço final automaticamente
        servico.calcular_preco_final()
        
        db.session.add(servico)
        db.session.commit()
        
        return jsonify(servico.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@servicos_bp.route('/servicos/<int:servico_id>', methods=['GET'])
def obter_servico(servico_id):
    try:
        servico = Servico.query.get_or_404(servico_id)
        return jsonify(servico.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@servicos_bp.route('/servicos/<int:servico_id>', methods=['PUT'])
def atualizar_servico(servico_id):
    try:
        servico = Servico.query.get_or_404(servico_id)
        data = request.get_json()
        
        servico.nome = data.get('nome', servico.nome)
        servico.descricao = data.get('descricao', servico.descricao)
        servico.categoria = data.get('categoria', servico.categoria)
        servico.tempo_estimado = int(data.get('tempo_estimado', servico.tempo_estimado))
        servico.preco_base = float(data.get('preco_base', servico.preco_base))
        servico.custo_mao_obra = float(data.get('custo_mao_obra', servico.custo_mao_obra))
        servico.custo_materiais = float(data.get('custo_materiais', servico.custo_materiais))
        servico.margem_lucro_percentual = float(data.get('margem_lucro_percentual', servico.margem_lucro_percentual))
        servico.data_atualizacao = datetime.utcnow()
        
        # Recalcular preço final
        servico.calcular_preco_final()
        
        db.session.commit()
        
        return jsonify(servico.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@servicos_bp.route('/servicos/<int:servico_id>', methods=['DELETE'])
def deletar_servico(servico_id):
    try:
        servico = Servico.query.get_or_404(servico_id)
        servico.ativo = False
        servico.data_atualizacao = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Serviço removido com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@servicos_bp.route('/servicos/<int:servico_id>/calcular-preco', methods=['POST'])
def calcular_preco_servico(servico_id):
    try:
        servico = Servico.query.get_or_404(servico_id)
        data = request.get_json()
        
        # Atualizar custos temporariamente para cálculo
        custo_mao_obra = float(data.get('custo_mao_obra', servico.custo_mao_obra))
        custo_materiais = float(data.get('custo_materiais', servico.custo_materiais))
        margem_lucro = float(data.get('margem_lucro_percentual', servico.margem_lucro_percentual))
        
        # Calcular preço final
        custo_total = custo_mao_obra + custo_materiais
        preco_final = custo_total * (1 + margem_lucro / 100)
        
        return jsonify({
            'custo_mao_obra': custo_mao_obra,
            'custo_materiais': custo_materiais,
            'custo_total': custo_total,
            'margem_lucro_percentual': margem_lucro,
            'preco_final': preco_final
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

