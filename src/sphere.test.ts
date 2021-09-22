import * as KdTree from "./index"

var array = KdTree.randomPoints(10000, 130, 150, 30, 50)
var array1 = Array.from(array)
var array2 = Array.from(array)

function compareAndCheck(queries: Array<KdTree.Point2D>, points: Array<KdTree.Point2D>, tree: KdTree.SearchNode) {
  queries.forEach(query => {
    points.sort((a, b) => KdTree.measure(a, query, true) - KdTree.measure(b, query, true))
    // various params: k, r
    for (var i = 0; i < 100; i++) {
      // r = 0
      var k = Math.round(Math.random() * 20) + 1
      var result = KdTree.searchNearest(tree, query, k, 0, true)
      if (!KdTree.pointArrayEquals(result, points.slice(0, result.length))) {
        console.error(`not matched. k=${k} r=0`)
      }
      // r > 0
      k = Math.round(Math.random() * 5) + 1
      var r = Math.random() * 20
      var result2 = KdTree.searchNearest(tree, query, k, 0, true)
      if (!KdTree.pointArrayEquals(result2, points.slice(0, result2.length))) {
        console.error(`not matched. k=1 r=${r}`)
      }
    }
  })
}

describe("sphere", () => {
  var tree: KdTree.SearchNode
  test("build", () => {
    tree = KdTree.buildTree(array2)
  })
  test("normal", () => {
    compareAndCheck(KdTree.randomPoints(20, 130, 150, 30, 50), array1, tree)
  })
  test("singular", () => {
    var points: Array<KdTree.Point2D> = [
      { x: 0, y: 0 },
      { x: 90, y: 0 },
      { x: 130, y: 0 },
      { x: 0, y: 90 },
      { x: 0, y: -90 },
    ]
    compareAndCheck(points, array1, tree)
  })
  test("release", () => {
    KdTree.releaseTree(tree)
  })
})


