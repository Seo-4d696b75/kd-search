import * as KdTree from "./tree"
import { compareAndCheck, randomPoints } from "./test_util"

var array = randomPoints(1000, "euclidean-points")
var array1 = Array.from(array)
var array2 = Array.from(array)

function fetchNodePoint(node: KdTree.SearchNode, depth: number, dst: Array<KdTree.Point2D>) {
  if (depth < 0) return
  dst.push(node)
  if (node.left) fetchNodePoint(node.left, depth - 1, dst)
  if (node.right) fetchNodePoint(node.right, depth - 1, dst)
}

describe("euclidean", () => {
  var tree: KdTree.SearchNode
  test("build", () => {
    tree = KdTree.buildTree(array2)
  })
  test("normal", () => {
    compareAndCheck(randomPoints(100, "euclidean-query"), array1, tree, KdTree.MeasureType.Euclidean)
  })
  test("singular", () => {
    var points: Array<KdTree.Point2D> = []
    fetchNodePoint(tree, 4, points)
    compareAndCheck(points, array1, tree, KdTree.MeasureType.Euclidean)
  })
  test("release", () => {
    KdTree.releaseTree(tree)
  })
})


