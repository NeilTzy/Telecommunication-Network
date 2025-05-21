from flask import Flask, render_template, request, redirect, url_for, session
from kruskal import kruskal
import random

app = Flask(__name__)
app.secret_key = 'secret123'

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/start', methods=['POST'])
def start():
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    graph = generate_graph()
    result = kruskal(graph["nodes"], graph["edges"])  # Run Kruskal algorithm
    return render_template('dashboard.html', graph=graph, mst=result["mst"], total_cost=result["total_cost"])

def generate_graph():
    num_nodes = random.randint(5, 10)
    nodes = list(range(num_nodes))
    edges = []
    edge_set = set()
    max_possible_edges = num_nodes * (num_nodes - 1) // 2
    num_edges = random.randint(num_nodes, max_possible_edges)

    while len(edges) < num_edges:
        u = random.randint(0, num_nodes - 1)
        v = random.randint(0, num_nodes - 1)
        if u != v and (u, v) not in edge_set and (v, u) not in edge_set:
            edge_set.add((u, v))
            edges.append({
                "u": u,
                "v": v,
                "weight": random.randint(1, 20)
            })

    return {"nodes": nodes, "edges": edges}


if __name__ == '__main__':
    app.run(debug=True)
