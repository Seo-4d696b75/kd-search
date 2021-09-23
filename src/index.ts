import { posix } from "path/posix"

/**
 * 平面状の点  
 * 
 * 球面を扱う場合は  
 * - x: 経度 longitude [deg] -180 <= x <= 180
 * - y: 緯度 latitude [deg] -90 <= y <= 90
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
 * 距離の計算に関して： Euclidean の場合はx,y座標の値に基づくユークリッド距離
 * Geodesic の場合はx,yを緯度・経度に読み替えて半径 @see SPHERE_RADIUS の球面上の大円距離で計算する
 * @param root 探索するkd-treeの根本
 * @param query この点の近傍点を探索する
 * @param k k番目までに近い点を探索する
 * @param r query からの距離がr以内の近傍点をすべて探索する
 * @param method Euclidean: ユークリッド距離 Geodesic: 球面上の大円距離 で計算する
 * @returns query から近い順にソートされた点のリスト length >= k
 */
export function searchNearest(root: SearchNode, query: Point2D, k: number, r: number = 0, method: MeasureType = MeasureType.Euclidean): Array<MeasuredPoint> {
  var result: Array<MeasuredPoint> = []
  var state: EuclideanSearch | GeodesicSearch
  if (method === MeasureType.Euclidean) {
    state = {
      type: MeasureType.Euclidean,
      node: root,
      query: query,
      k: k,
      r: r,
      result: result,
      traverse: 0,
    }
    searchEuclidean(state)
  } else {
    state = {
      type: MeasureType.Geodesic,
      node: root,
      query: query,
      k: k,
      r: r,
      result: result,
      region: {
        north: 90,
        south: -90,
        west: -180,
        east: 180
      },
      traverse: 0
    }
    searchGeodesic(state)
  }
  console.debug(`traverse: ${state.traverse}(k=${k},r=${r})`)
  return result
}

export const SPHERE_RADIUS = 6371009.0

export function measure(a: Point2D, b: Point2D, method: MeasureType = MeasureType.Euclidean) {
  if (method === MeasureType.Geodesic) {
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


export enum MeasureType {
  Euclidean,
  Geodesic
}

interface SearchStateBase<T> {
  type: T
  node: SearchNode | undefined
  query: Point2D
  k: number
  r: number
  result: Array<MeasuredPoint>,
  traverse: number
}

interface Region {
  north: number
  south: number
  west: number
  east: number
}

type ChildType = "left" | "right"

function invert(type: ChildType): ChildType {
  return type === "left" ? "right" : "left"
}

function getChild(node: SearchNode, which: ChildType): SearchNode | undefined {
  return which === "left" ? node.left : node.right
}

interface EuclideanSearch extends SearchStateBase<MeasureType.Euclidean> { }

interface GeodesicSearch extends SearchStateBase<MeasureType.Geodesic> {
  region: Region
}



function searchEuclidean(state: EuclideanSearch) {
  const node = state.node
  if (!node) return
  state.traverse += 1
  const pos = state.query
  const d = measure(pos, node, state.type)
  const size = state.result.length
  var index = -1
  if (size > 0 && d < state.result[size - 1].dist) {
    index = size - 1
    while (index > 0) {
      if (d >= state.result[index - 1].dist) break
      index -= 1;
    }
  } else if (size < state.k || d <= state.r) {
    index = size
  }
  if (index >= 0) {
    state.result.splice(index, 0, {
      x: node.x,
      y: node.y,
      dist: d
    })
    if (size >= state.k && state.result[size].dist > state.r) {
      state.result.pop()
    }
  }
  const compareX = (node.depth % 2 === 0)
  var threshold = compareX ? node.x : node.y
  var value = compareX ? pos.x : pos.y
  var next = {
    ...state,
    node: value < threshold ? node.left : node.right
  }
  searchEuclidean(next)
  state.traverse = next.traverse

  var dist2th = Math.abs(value - threshold)
  next = {
    ...state,
    node: value < threshold ? node.right : node.left
  }
  if (dist2th <= Math.max(state.result[state.result.length - 1].dist, state.r)) {
    searchEuclidean(next)
    state.traverse = next.traverse
  }
}

function searchGeodesic(state: GeodesicSearch) {
  const node = state.node
  if (!node) return
  state.traverse += 1
  const pos = state.query
  const d = measure(pos, node, state.type)
  const size = state.result.length
  var index = -1
  if (size > 0 && d < state.result[size - 1].dist) {
    index = size - 1
    while (index > 0) {
      if (d >= state.result[index - 1].dist) break
      index -= 1;
    }
  } else if (size < state.k || d <= state.r) {
    index = size
  }
  if (index >= 0) {
    state.result.splice(index, 0, {
      x: node.x,
      y: node.y,
      dist: d
    })
    if (size >= state.k && state.result[size].dist > state.r) {
      state.result.pop()
    }
  }
  const which = nextWhichChild(pos, state.region, node)
  var region = nextRegion(node, state.region, which)
  var next = {
    ...state,
    node: getChild(node, which),
    region: region
  }
  searchGeodesic(next)
  state.traverse = next.traverse

  const opposite = invert(which)
  region = nextRegion(node, state.region, opposite)
  var dist2th = minDist2Region(pos, region, node)
  if (dist2th <= Math.max(state.result[state.result.length - 1].dist, state.r)) {
    next = {
      ...state,
      node: getChild(node, opposite),
      region: region
    }
    searchGeodesic(next)
    state.traverse = next.traverse
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

/**
 * ある点と緯線・経線で囲まれた領域中の点との距離の下限を計算する
 * 
 * @param pos regionの内部にはないこと
 * @param region 
 * @param node 現在の探索ノード
 * @returns 領域中の点との距離の最小値以下
 */
function minDist2Region(pos: Point2D, region: Region, node: SearchNode): number {
  if (region.west < pos.x && pos.x < region.east &&
    region.south < pos.y && pos.y < region.north) {
    throw Error("pos in the region!")
  }
  if (node.depth % 2 === 0) {
    if (region.west < pos.x && pos.x < region.east) {
      throw Error("pos in the range of longitude!")
    }
    return Math.min(
      dist2lng(pos, region.east, region.south, region.north),
      dist2lng(pos, region.west, region.south, region.north)
    )
  } else {
    if (region.south < pos.y && pos.y < region.north) {
      throw Error("pos in the range of latitude!")
    }
    return Math.min(
      dist2lat(pos, region.north, region.west, region.east),
      dist2lat(pos, region.south, region.west, region.east)
    )
  }
}

function normalizeLng(lng: number): number {
  while (lng > 180) lng -= 360
  while (lng < -180) lng += 360
  return lng
}

/**
 * 経度の差の絶対値 
 * @param lng1 
 * @param lng2 
 * @returns 0 <= diff [deg] <= 180
 */
function absLng(lng1: number, lng2: number): number {
  return Math.abs(normalizeLng(lng1 - lng2))
}

function nextWhichChild(pos: Point2D, region: Region, node: SearchNode): ChildType {
  if (node.depth % 2 === 0) {
    if (region.west <= pos.x && pos.x <= region.east) {
      return pos.x < node.x ? "left" : "right"
    } else {
      return absLng(pos.x, region.west) < absLng(pos.x, region.east) ? "left" : "right"
    }
  } else {
    return pos.y < node.y ? "left" : "right"
  }
}

function nextRegion(node: SearchNode, current: Region, which: ChildType): Region {
  var next = {
    ...current
  }
  if (node.depth % 2 === 0) {
    if (which === "left") {
      next.east = node.x
    } else {
      next.west = node.x
    }
  } else {
    if (which === "left") {
      next.north = node.y
    } else {
      next.south = node.y
    }
  }
  return next
}

/**
 * 経線との最短距離
 * @param pos 
 * @param longitude {(x,y)|x=longitude, -90<=y<=90} の経線
 * @returns 
 */
function distance2longitude(pos: Point2D, longitude: number): number {
  var lng = Math.PI * Math.abs(pos.x - longitude) / 180
  var lat = Math.PI * pos.y / 180
  if (absLng(pos.x, longitude) <= 90) {
    return SPHERE_RADIUS * Math.asin(Math.sin(lng) * Math.cos(lat))
  } else {
    return SPHERE_RADIUS * Math.PI * Math.min(Math.abs(90 - pos.y), Math.abs(-90 - pos.y)) / 180
  }
}

function dist2lng(pos: Point2D, longitude: number, south: number, north: number): number {
  // まず端点との距離
  var dist = [
    measure(pos, { x: longitude, y: south }, MeasureType.Geodesic),
    measure(pos, { x: longitude, y: north }, MeasureType.Geodesic)
  ]
  var d_lng = absLng(pos.x, longitude)
  if (d_lng <= 90) {
    // 経線への垂線の長さ
    var lng = Math.PI * d_lng / 180
    var lat = Math.PI * pos.y / 180
    var h = SPHERE_RADIUS * Math.asin(Math.sin(lng) * Math.cos(lat))
    // 垂線の足の緯度
    var y = 90 - 180 * Math.atan2(Math.cos(lng), Math.tan(lat)) / Math.PI
    if (south < y && y < north) {
      dist.push(h)
    }
  }
  return Math.min(...dist)
}

function dist2lat(pos: Point2D, latitude: number, west: number, east: number): number {
  // まず端点との距離
  var dist = [
    measure(pos, { x: east, y: latitude }, MeasureType.Geodesic),
    measure(pos, { x: west, y: latitude }, MeasureType.Geodesic)
  ]
  if (west < pos.x && pos.x < east) {
    // 垂線の長さ(=経線の一部)
    var h = SPHERE_RADIUS * Math.PI * Math.abs(pos.y - latitude) / 180
    dist.push(h)
  }
  return Math.min(...dist)
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
    array1.sort((a, b) => measure(a, query, MeasureType.Geodesic) - measure(b, query, MeasureType.Geodesic))
  })
  console.timeEnd("sort")
  console.time("kd-tree-build")
  tree = buildTree(array2)
  console.timeEnd("kd-tree-build")
  console.time("kd-tree")
  queries.forEach(query => {
    searchNearest(tree, query, 1, 0, MeasureType.Geodesic)
  })
  console.timeEnd("kd-tree")
}

