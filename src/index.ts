
/**
 * 平面状の点  
 * 
 * 球面を扱う場合は  
 * - x: 経度 longitude
 * - y: 緯度 latitude
 */
export interface Point2D {
  x: number
  y: number
}

export function pointEquals(a: Point2D, b: Point2D) {
  return a.x === b.x && a.y === b.y
}

export function pointArrayEquals(a: Array<Point2D>, b: Array<Point2D>) {
  if (a.length !== b.length) return false
  for (var i = 0; i < a.length; i++) {
    if (!pointEquals(a[i], b[i])) return false
  }
  return true
}

/**
 * kd-tree の頂点
 * 
 * この頂点自身がひとつの座標点をもち,
 * left には自身より小さい座標点が, 
 * right には自身より大きい座標点が含まれる  
 * 座標点 Point2D の大小はは頂点の depth によって x,y 座標の大小で比較する
 */
export interface SearchNode extends Point2D {
  depth: number
  left?: SearchNode
  right?: SearchNode
}

/**
 * 探索結果の座標点
 */
export interface MeasuredPoint extends Point2D {
  /**
   * 探索の中心点からの距離
   */
  dist: number
}

type Comparator<T> = (a: T, b: T) => number
const X_COMPARATOR: Comparator<Point2D> = (a, b) => {
  return a.x - b.x
}
const Y_COMPARATOR: Comparator<Point2D> = (a, b) => {
  return a.y - b.y
}

function getComparator(depth: number): Comparator<Point2D> {
  if (depth % 2 === 0) {
    return X_COMPARATOR
  } else {
    return Y_COMPARATOR
  }
}

export function buildTree(points: Array<Point2D>): SearchNode {
  return buildSubTree(points, 0)
}

function buildSubTree(points: Array<Point2D>, depth: number): SearchNode {
  points.sort(getComparator(depth))
  var mid = Math.floor(points.length / 2)
  var p = points[mid]
  var n: SearchNode = {
    x: p.x,
    y: p.y,
    depth: depth
  }
  if (mid > 0) {
    n.left = buildSubTree(points.slice(0, mid), depth + 1)
  }
  if (mid + 1 < points.length) {
    n.right = buildSubTree(points.slice(mid + 1, points.length), depth + 1)
  }
  return n
}

export function releaseTree(root: SearchNode) {
  if (root.left) releaseTree(root.left)
  if (root.right) releaseTree(root.right)
  root.left = undefined
  root.right = undefined
}

/**
 * kd-tree で最近傍探索  
 * 
 * 距離の計算に関して： sphere === false の場合はx,y座標の値に基づくユークリッド距離
 * sphere === true の場合はx,yを緯度・経度に読み替えて半径 @see SPHERE_RADIUS の球面上の大円距離で計算する
 * @param root 探索するkd-treeの根本
 * @param query この点の近傍点を探索する
 * @param k k番目までに近い点を探索する
 * @param r query からの距離がr以内の近傍点をすべて探索する
 * @param sphere false: ユークリッド距離 true: 球面上の大円距離 で計算する
 * @returns query から近い順にソートされた点のリスト length >= k
 */
export function searchNearest(root: SearchNode, query: Point2D, k: number, r: number = 0, sphere: boolean = false): Array<MeasuredPoint> {
  var result: Array<MeasuredPoint> = []
  search(root, query, k, r, sphere, result)
  return result
}

export const SPHERE_RADIUS = 6371009.0

export function measure(a: Point2D, b: Point2D, sphere: boolean = false) {
  if (sphere) {
    var lng1 = Math.PI * a.x / 180
    var lat1 = Math.PI * a.y / 180
    var lng2 = Math.PI * b.x / 180
    var lat2 = Math.PI * b.y / 180
    var lng = (lng1 - lng2) / 2
    var lat = (lat1 - lat2) / 2
    return SPHERE_RADIUS * 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(lat), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(lng), 2)))
  } else {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
  }
}

function distance2longitude(pos: Point2D, lonitude: number): number {
  var lng = Math.PI * Math.abs(pos.x - lonitude) / 180
  var lat = Math.PI * pos.y / 180
  return SPHERE_RADIUS * Math.asin(Math.sin(lng) * Math.cos(lat))
}

function search(node: SearchNode, pos: Point2D, k: number, r: number, sphere: boolean, result: Array<MeasuredPoint>) {
  const d = measure(pos, node, sphere)
  const size = result.length
  var index = -1
  if (size > 0 && d < result[size - 1].dist) {
    index = size - 1
    while (index > 0) {
      if (d >= result[index - 1].dist) break
      index -= 1;
    }
  } else if (size < k || d <= r) {
    index = size
  }
  if (index >= 0) {
    result.splice(index, 0, {
      x: node.x,
      y: node.y,
      dist: d
    })
    if (size === k && result[size].dist > r) {
      result.pop()
    }
  }
  const compareX = (node.depth % 2 === 0)
  var threshold = compareX ? node.x : node.y
  var value = compareX ? pos.x : pos.y
  var next = value < threshold ? node.left : node.right
  if (next) {
    search(next, pos, k, r, sphere, result)
  }

  var dist2th: number
  if ( sphere ){
    if ( compareX ){
      dist2th = distance2longitude(pos, threshold)
    } else {
      dist2th = SPHERE_RADIUS * Math.PI * Math.abs(pos.y - threshold) / 180
    }
  } else {
    dist2th = Math.abs(value - threshold)
  }
  next = value < threshold ? node.right : node.left
  if (next && dist2th < Math.max(result[result.length - 1].dist, r)) {
    search(next, pos, k, r, sphere, result)
  }
}

export function randomPoints(size: number, x_lower: number = 0, x_upper: number = 100,
  y_lower: number = 0, y_upper: number = 100): Array<Point2D> {
  return Array(size).fill(0).map(() => {
    return {
      x: Math.random() * (x_upper - x_lower) + x_lower,
      y: Math.random() * (y_upper - y_lower) + y_lower,
    }
  })
}

if (process.argv[2]) {
  const size = parseInt(process.argv[2])
  console.log("points size:", size * 100, "query size:", size)
  var array = randomPoints(size * 100)
  var array1 = Array.from(array)
  var array2 = Array.from(array)

  var queries = randomPoints(size)
  var tree: SearchNode
  console.time("sort")
  queries.forEach(query => {
    array1.sort((a, b) => measure(a, query) - measure(b, query))
  })
  console.timeEnd("sort")
  console.time("kd-tree-build")
  tree = buildTree(array2)
  console.timeEnd("kd-tree-build")
  console.time("kd-tree")
  queries.forEach(query => {
    searchNearest(tree, query, 1, 0)
  })
  console.timeEnd("kd-tree")
}
