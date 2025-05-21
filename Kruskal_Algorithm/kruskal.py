# kruskal.py

class DisjointSet:
    def __init__(self, n):
        self.parent = list(range(n))

    def find(self, u):
        if self.parent[u] != u:
            self.parent[u] = self.find(self.parent[u])  # Path compression
        return self.parent[u]

    def union(self, u, v):
        pu, pv = self.find(u), self.find(v)
        if pu != pv:
            self.parent[pu] = pv
            return True
        return False


def kruskal(nodes, edges):
    # Sort edges by weight
    sorted_edges = sorted(edges, key=lambda x: x['weight'])
    ds = DisjointSet(len(nodes))

    mst = []
    total_cost = 0

    for edge in sorted_edges:
        if ds.union(edge['u'], edge['v']):
            mst.append(edge)
            total_cost += edge['weight']

    return {
        "mst": mst,
        "total_cost": total_cost
    }
