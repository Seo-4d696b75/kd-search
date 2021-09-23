import * as KdTree from "./index"

var array = KdTree.randomPoints(1000)
var array1 = Array.from(array)
var array2 = Array.from(array)

function fetchNodePoint(node: KdTree.SearchNode, depth: number, dst: Array<KdTree.Point2D>) {
  if (depth < 0) return
  dst.push(node)
  if (node.left) fetchNodePoint(node.left, depth - 1, dst)
  if (node.right) fetchNodePoint(node.right, depth - 1, dst)
}

function compareAndCheck(queries: Array<KdTree.Point2D>, points: Array<KdTree.Point2D>, tree: KdTree.SearchNode) {
  queries.forEach(query => {
    points.sort((a, b) => KdTree.measure(a, query) - KdTree.measure(b, query))
    // various params: k, r
    for (var i = 0; i < 10; i++) {
      // r = 0
      var k = Math.round(Math.random() * 20) + 1
      var result = KdTree.searchNearest(tree, query, k, 0)
      if (!KdTree.pointArrayEquals(result, points.slice(0, result.length))) {
        console.error(`not matched. k=${k} r=0`)
      }
      // r > 0
      k = Math.round(Math.random() * 5) + 1
      var r = Math.random() * 20
      var result2 = KdTree.searchNearest(tree, query, k, 0)
      if (!KdTree.pointArrayEquals(result2, points.slice(0, result2.length))) {
        console.error(`not matched. k=1 r=${r}`)
      }
    }
  })
}

describe("euclidean", () => {
  var tree: KdTree.SearchNode
  test("build", () => {
    tree = KdTree.buildTree(array2)
  })
  test("normal", () => {
    compareAndCheck(KdTree.randomPoints(100), array1, tree)
  })
  test("singular", () => {
    var points: Array<KdTree.Point2D> = []
    fetchNodePoint(tree, 4, points)
    compareAndCheck(points, array1, tree)
  })
  test("release", () => {
    KdTree.releaseTree(tree)
  })
})


