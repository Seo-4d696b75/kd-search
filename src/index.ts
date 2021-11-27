import { searchNearest } from "./search"
import { randomPoints } from "./test_util"
import { buildTree, measure, MeasureType, SearchNode } from "./tree"

if (process.argv[2]) {
  const size = parseInt(process.argv[2])
  console.log("points size:", size * 100, "query size:", size)
  var array = randomPoints(size * 100, "points", -180, 180, -90, 90)
  var queries = randomPoints(size, "query", -180, 180, -90, 90)
  queries.push(
    { x: -180, y: 0 },
    { x: 180, y: 10 },
    { x: 175, y: -20 }
  )
  var tree: SearchNode
  console.time("sort")
  queries.forEach(query => {
    array.sort((a, b) => measure(a, query, MeasureType.Geodesic) - measure(b, query, MeasureType.Geodesic))
  })
  console.timeEnd("sort")
  console.time("kd-tree-build")
  tree = buildTree(array)
  console.timeEnd("kd-tree-build")
  console.time("kd-tree")
  queries.forEach(query => {
    searchNearest(tree, query, 1, 0, MeasureType.Geodesic)
  })
  console.timeEnd("kd-tree")
}