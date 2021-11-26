import * as KdTree from "./index"

var array = KdTree.randomPoints(1000, -100, 0, -10, 70)
array.push(
  {x: 170, y:0}
)
var array1 = Array.from(array)
var array2 = Array.from(array)

function compareAndCheck(queries: Array<KdTree.Point2D>, points: Array<KdTree.Point2D>, tree: KdTree.SearchNode) {
  queries.forEach(query => {
    points.sort((a, b) => KdTree.measure(a, query, KdTree.MeasureType.Geodesic) - KdTree.measure(b, query, KdTree.MeasureType.Geodesic))
    // various params: k, r
    for (var i = 0; i < 10; i++) {
      // r = 0
      var k = Math.round(Math.random() * 20) + 1
      var result = KdTree.searchNearest(tree, query, k, 0, KdTree.MeasureType.Geodesic)
      if (!KdTree.pointArrayEquals(result, points.slice(0, result.length))) {
        console.error(`not matched. k=${k} r=0 q=(${query.x},${query.y})`, 
        "kdtree", result, "qsort", points.slice(0, result.length))
      }
      // r > 0
      k = Math.round(Math.random() * 5) + 1
      var r = Math.random() * 20
      var result2 = KdTree.searchNearest(tree, query, k, 0, KdTree.MeasureType.Geodesic)
      if (!KdTree.pointArrayEquals(result2, points.slice(0, result2.length))) {
        console.error(`not matched. k=1 r=${r} q=(${query.x},${query.y})`,
        "kdtree", result, "qsort", points.slice(0, result.length))
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
    compareAndCheck(KdTree.randomPoints(100, -180, 180, -90, 90), array1, tree)
  })
  test("singular", () => {
    var points: Array<KdTree.Point2D> = [
      { x: 0, y: 0 },
      { x: 90, y: 0 },
      { x: 130, y: 0 },
      { x: 0, y: 90 },
      { x: 0, y: -90 },
      { x: -180, y: 0 },
      { x: -180, y: 30 },
      { x: -180, y: 60 },
      { x: -180, y: -30 },
      { x: 180, y: 0 },
      { x: 180, y: 30 },
      { x: 180, y: 60 },
      { x: 180, y: -30 },
    ]
    compareAndCheck(points, array1, tree)
  })
  test("release", () => {
    KdTree.releaseTree(tree)
  })
})


