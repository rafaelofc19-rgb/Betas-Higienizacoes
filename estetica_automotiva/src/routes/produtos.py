from flask import Blueprint, request, jsonify
from src.models.produto import Produto, db
from datetime import datetime

produtos_bp = Blueprint('produtos', __name__)

@produtos_bp.route('/produtos', methods=['GET'])
def listar_produtos():
    try:
        produtos = Produto.query.filter_by(ativo=True).all()
        return jsonify([produto.to_dict() for produto in produtos])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos', methods=['POST'])
def criar_produto():
    try:
        data = request.get_json()
        
        produto = Produto(
            nome=data['nome'],
            descricao=data.get('descricao', ''),
            categoria=data['categoria'],
            preco_custo=float(data['preco_custo']),
            preco_venda=float(data['preco_venda']),
            quantidade_estoque=int(data['quantidade_estoque']),
            estoque_minimo=int(data.get('estoque_minimo', 5)),
            unidade_medida=data.get('unidade_medida', 'unidade')
        )
        
        db.session.add(produto)
        db.session.commit()
        
        return jsonify(produto.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/<int:produto_id>', methods=['GET'])
def obter_produto(produto_id):
    try:
        produto = Produto.query.get_or_404(produto_id)
        return jsonify(produto.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/<int:produto_id>', methods=['PUT'])
def atualizar_produto(produto_id):
    try:
        produto = Produto.query.get_or_404(produto_id)
        data = request.get_json()
        
        produto.nome = data.get('nome', produto.nome)
        produto.descricao = data.get('descricao', produto.descricao)
        produto.categoria = data.get('categoria', produto.categoria)
        produto.preco_custo = float(data.get('preco_custo', produto.preco_custo))
        produto.preco_venda = float(data.get('preco_venda', produto.preco_venda))
        produto.quantidade_estoque = int(data.get('quantidade_estoque', produto.quantidade_estoque))
        produto.estoque_minimo = int(data.get('estoque_minimo', produto.estoque_minimo))
        produto.unidade_medida = data.get('unidade_medida', produto.unidade_medida)
        produto.data_atualizacao = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(produto.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/<int:produto_id>', methods=['DELETE'])
def deletar_produto(produto_id):
    try:
        produto = Produto.query.get_or_404(produto_id)
        produto.ativo = False
        produto.data_atualizacao = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Produto removido com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/estoque-baixo', methods=['GET'])
def produtos_estoque_baixo():
    try:
        produtos = Produto.query.filter(
            Produto.ativo == True,
            Produto.quantidade_estoque <= Produto.estoque_minimo
        ).all()
        return jsonify([produto.to_dict() for produto in produtos])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/<int:produto_id>/movimentar-estoque', methods=['POST'])
def movimentar_estoque(produto_id):
    try:
        produto = Produto.query.get_or_404(produto_id)
        data = request.get_json()
        
        tipo_movimentacao = data['tipo']  # 'entrada' ou 'saida'
        quantidade = int(data['quantidade'])
        
        if tipo_movimentacao == 'entrada':
            produto.quantidade_estoque += quantidade
        elif tipo_movimentacao == 'saida':
            if produto.quantidade_estoque >= quantidade:
                produto.quantidade_estoque -= quantidade
            else:
                return jsonify({'error': 'Quantidade insuficiente em estoque'}), 400
        else:
            return jsonify({'error': 'Tipo de movimentação inválido'}), 400
        
        produto.data_atualizacao = datetime.utcnow()
        db.session.commit()
        
        return jsonify(produto.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

