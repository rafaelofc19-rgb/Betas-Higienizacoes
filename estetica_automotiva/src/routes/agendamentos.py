from flask import Blueprint, request, jsonify
from src.models.agendamento import Agendamento, Cliente, db
from src.models.servico import Servico
from datetime import datetime, timedelta

agendamentos_bp = Blueprint('agendamentos', __name__)

@agendamentos_bp.route('/clientes', methods=['GET'])
def listar_clientes():
    try:
        clientes = Cliente.query.filter_by(ativo=True).all()
        return jsonify([cliente.to_dict() for cliente in clientes])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/clientes', methods=['POST'])
def criar_cliente():
    try:
        data = request.get_json()
        
        cliente = Cliente(
            nome=data['nome'],
            telefone=data['telefone'],
            email=data.get('email', ''),
            endereco=data.get('endereco', '')
        )
        
        db.session.add(cliente)
        db.session.commit()
        
        return jsonify(cliente.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos', methods=['GET'])
def listar_agendamentos():
    try:
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        status = request.args.get('status')
        
        query = Agendamento.query
        
        if data_inicio:
            data_inicio = datetime.fromisoformat(data_inicio.replace('Z', '+00:00'))
            query = query.filter(Agendamento.data_agendamento >= data_inicio)
        
        if data_fim:
            data_fim = datetime.fromisoformat(data_fim.replace('Z', '+00:00'))
            query = query.filter(Agendamento.data_agendamento <= data_fim)
        
        if status:
            query = query.filter(Agendamento.status == status)
        
        agendamentos = query.order_by(Agendamento.data_agendamento).all()
        return jsonify([agendamento.to_dict() for agendamento in agendamentos])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos', methods=['POST'])
def criar_agendamento():
    try:
        data = request.get_json()
        
        # Verificar se o cliente existe
        cliente = Cliente.query.get(data['cliente_id'])
        if not cliente:
            return jsonify({'error': 'Cliente não encontrado'}), 404
        
        # Verificar se o serviço existe
        servico = Servico.query.get(data['servico_id'])
        if not servico:
            return jsonify({'error': 'Serviço não encontrado'}), 404
        
        # Converter data do agendamento
        data_agendamento = datetime.fromisoformat(data['data_agendamento'].replace('Z', '+00:00'))
        
        # Verificar se já existe agendamento no mesmo horário
        agendamento_existente = Agendamento.query.filter(
            Agendamento.data_agendamento == data_agendamento,
            Agendamento.status.in_(['agendado', 'confirmado', 'em_andamento'])
        ).first()
        
        if agendamento_existente:
            return jsonify({'error': 'Já existe um agendamento para este horário'}), 400
        
        agendamento = Agendamento(
            cliente_id=data['cliente_id'],
            servico_id=data['servico_id'],
            data_agendamento=data_agendamento,
            observacoes=data.get('observacoes', ''),
            valor_total=servico.preco_final
        )
        
        db.session.add(agendamento)
        db.session.commit()
        
        return jsonify(agendamento.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos/<int:agendamento_id>', methods=['GET'])
def obter_agendamento(agendamento_id):
    try:
        agendamento = Agendamento.query.get_or_404(agendamento_id)
        return jsonify(agendamento.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos/<int:agendamento_id>', methods=['PUT'])
def atualizar_agendamento(agendamento_id):
    try:
        agendamento = Agendamento.query.get_or_404(agendamento_id)
        data = request.get_json()
        
        if 'data_agendamento' in data:
            nova_data = datetime.fromisoformat(data['data_agendamento'].replace('Z', '+00:00'))
            
            # Verificar se já existe agendamento no novo horário
            agendamento_existente = Agendamento.query.filter(
                Agendamento.data_agendamento == nova_data,
                Agendamento.id != agendamento_id,
                Agendamento.status.in_(['agendado', 'confirmado', 'em_andamento'])
            ).first()
            
            if agendamento_existente:
                return jsonify({'error': 'Já existe um agendamento para este horário'}), 400
            
            agendamento.data_agendamento = nova_data
        
        agendamento.status = data.get('status', agendamento.status)
        agendamento.observacoes = data.get('observacoes', agendamento.observacoes)
        agendamento.data_atualizacao = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(agendamento.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos/<int:agendamento_id>', methods=['DELETE'])
def cancelar_agendamento(agendamento_id):
    try:
        agendamento = Agendamento.query.get_or_404(agendamento_id)
        agendamento.status = 'cancelado'
        agendamento.data_atualizacao = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Agendamento cancelado com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@agendamentos_bp.route('/agendamentos/horarios-disponiveis', methods=['GET'])
def horarios_disponiveis():
    try:
        data_str = request.args.get('data')
        if not data_str:
            return jsonify({'error': 'Data é obrigatória'}), 400
        
        data = datetime.fromisoformat(data_str)
        
        # Horários de funcionamento (8h às 18h)
        horarios_funcionamento = []
        for hora in range(8, 18):
            horarios_funcionamento.append(data.replace(hour=hora, minute=0, second=0, microsecond=0))
        
        # Buscar agendamentos existentes para a data
        agendamentos_existentes = Agendamento.query.filter(
            db.func.date(Agendamento.data_agendamento) == data.date(),
            Agendamento.status.in_(['agendado', 'confirmado', 'em_andamento'])
        ).all()
        
        horarios_ocupados = [ag.data_agendamento for ag in agendamentos_existentes]
        horarios_disponiveis = [h for h in horarios_funcionamento if h not in horarios_ocupados]
        
        return jsonify([h.isoformat() for h in horarios_disponiveis])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

