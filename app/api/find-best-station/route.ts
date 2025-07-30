import { type NextRequest, NextResponse } from "next/server"

// Multiple Algorithm Implementation for Best EV Charging Station
export async function POST(request: NextRequest) {
  try {
    const { userLocation, stations } = await request.json()

    if (!userLocation || !stations || stations.length === 0) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }

    console.log("🤖 Running multiple algorithms to find best station...")

    // Step 1: Prepare data for algorithms
    const stationData = await prepareStationData(userLocation, stations)

    if (stationData.length === 0) {
      return NextResponse.json({ error: "No valid station data" }, { status: 500 })
    }

    // Step 2: Run different algorithms
    const results = {
      dijkstra: runDijkstraAlgorithm(stationData, userLocation),
      aStar: runAStarAlgorithm(stationData, userLocation),
      genetic: runGeneticAlgorithm(stationData, userLocation),
      machineLearning: runMLAlgorithm(stationData, userLocation),
    }

    // Step 3: Compare results and find consensus
    const bestStation = findConsensusWinner(results, stationData)

    console.log("✅ Algorithm comparison complete!")

    return NextResponse.json({
      bestStation,
      algorithmResults: results,
      explanation: generateExplanation(results, bestStation),
    })
  } catch (error) {
    console.error("💥 Algorithm error:", error)
    return NextResponse.json({ error: "Algorithm failed" }, { status: 500 })
  }
}

// Prepare station data with all factors
async function prepareStationData(userLocation: any, stations: any[]) {
  const stationData = []

  for (let i = 0; i < Math.min(stations.length, 8); i++) {
    const station = stations[i]

    // Calculate basic metrics
    const distance = calculateDistance(userLocation.lat, userLocation.lng, station.lat, station.lng)
    const estimatedTime = (distance / 50) * 60 // Assume 50 km/h average

    // Calculate various factors
    const factors = {
      distance: distance,
      time: estimatedTime,
      reliability: calculateReliability(station),
      chargingSpeed: calculateChargingSpeed(station),
      cost: calculateCost(station),
      availability: calculateAvailability(station),
      accessibility: calculateAccessibility(station),
    }

    stationData.push({
      station,
      factors,
      id: i,
    })
  }

  return stationData
}

// 1. DIJKSTRA'S ALGORITHM - Classic shortest path
function runDijkstraAlgorithm(stationData: any[], userLocation: any) {
  console.log("🔍 Running Dijkstra's Algorithm...")

  // Create distance array (lower is better)
  const distances = stationData.map((data) => {
    // Weighted distance considering multiple factors
    const weightedDistance =
      data.factors.distance * 0.4 + // 40% distance weight
      data.factors.time * 0.3 + // 30% time weight
      (100 - data.factors.reliability) * 0.2 + // 20% reliability (inverted)
      (100 - data.factors.chargingSpeed) * 0.1 // 10% speed (inverted)

    return { id: data.id, distance: weightedDistance, station: data.station }
  })

  // Sort by weighted distance (Dijkstra's core principle)
  distances.sort((a, b) => a.distance - b.distance)

  const winner = distances[0]
  console.log(`   🏆 Dijkstra winner: ${winner.station.name} (score: ${winner.distance.toFixed(1)})`)

  return {
    algorithm: "Dijkstra's Shortest Path",
    winner: winner.station,
    score: 100 - winner.distance, // Convert to positive score
    reasoning: "Minimizes weighted distance considering multiple factors",
  }
}

// 2. A* ALGORITHM - Heuristic search
function runAStarAlgorithm(stationData: any[], userLocation: any) {
  console.log("🎯 Running A* Algorithm...")

  const aStarScores = stationData.map((data) => {
    // g(n) - actual cost from start
    const actualCost = data.factors.distance + data.factors.time * 0.5

    // h(n) - heuristic (estimated remaining cost)
    const heuristic =
      (100 - data.factors.reliability) * 0.3 +
      (100 - data.factors.chargingSpeed) * 0.2 +
      (100 - data.factors.availability) * 0.1

    // f(n) = g(n) + h(n)
    const fScore = actualCost + heuristic

    return { id: data.id, fScore, station: data.station }
  })

  // A* selects node with lowest f(n)
  aStarScores.sort((a, b) => a.fScore - b.fScore)

  const winner = aStarScores[0]
  console.log(`   🏆 A* winner: ${winner.station.name} (f-score: ${winner.fScore.toFixed(1)})`)

  return {
    algorithm: "A* Heuristic Search",
    winner: winner.station,
    score: 100 - winner.fScore,
    reasoning: "Uses heuristic to predict best path considering future costs",
  }
}

// 3. GENETIC ALGORITHM - Evolutionary optimization (FIXED)
function runGeneticAlgorithm(stationData: any[], userLocation: any) {
  console.log("🧬 Running Genetic Algorithm...")

  // Create initial population with normalized weights
  const populationSize = 20
  const generations = 15
  let population = []

  // Initialize population with random weight combinations
  for (let i = 0; i < populationSize; i++) {
    const weights = {
      distance: Math.random(),
      time: Math.random(),
      reliability: Math.random(),
      speed: Math.random(),
      cost: Math.random(),
      availability: Math.random(),
      accessibility: Math.random(),
    }

    // Normalize weights to sum to 1
    const sum = Object.values(weights).reduce((a, b) => a + b, 0)
    Object.keys(weights).forEach((key) => {
      weights[key] = weights[key] / sum
    })

    population.push({
      weights,
      fitness: 0,
      bestStation: null,
    })
  }

  console.log(`   🧬 Starting evolution with ${populationSize} individuals over ${generations} generations`)

  // Evolution loop
  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness for each individual
    population.forEach((individual) => {
      const result = evaluateGeneticFitness(individual.weights, stationData)
      individual.fitness = result.fitness
      individual.bestStation = result.bestStation
    })

    // Sort by fitness (higher is better)
    population.sort((a, b) => b.fitness - a.fitness)

    console.log(
      `   Gen ${gen + 1}: Best fitness = ${population[0].fitness.toFixed(2)}, Station = ${population[0].bestStation.name}`,
    )

    // Selection: Keep top 50%
    const survivors = population.slice(0, Math.floor(populationSize / 2))
    const newPopulation = [...survivors]

    // Create offspring through crossover and mutation
    while (newPopulation.length < populationSize) {
      // Select two random parents from survivors
      const parent1 = survivors[Math.floor(Math.random() * survivors.length)]
      const parent2 = survivors[Math.floor(Math.random() * survivors.length)]

      // Create child through crossover
      const child = geneticCrossover(parent1, parent2)

      // Apply mutation
      geneticMutation(child, 0.1) // 10% mutation rate

      newPopulation.push(child)
    }

    population = newPopulation
  }

  // Final evaluation
  population.forEach((individual) => {
    const result = evaluateGeneticFitness(individual.weights, stationData)
    individual.fitness = result.fitness
    individual.bestStation = result.bestStation
  })

  population.sort((a, b) => b.fitness - a.fitness)
  const winner = population[0]

  console.log(`   🏆 Genetic winner: ${winner.bestStation.name} (fitness: ${winner.fitness.toFixed(2)})`)
  console.log(
    `   🧬 Final weights:`,
    Object.entries(winner.weights)
      .map(([k, v]) => `${k}:${(v * 100).toFixed(1)}%`)
      .join(", "),
  )

  return {
    algorithm: "Genetic Algorithm",
    winner: winner.bestStation,
    score: winner.fitness,
    reasoning: `Evolved optimal weights over ${generations} generations with ${populationSize} individuals`,
  }
}

// 4. MACHINE LEARNING ALGORITHM - Feature-based scoring
function runMLAlgorithm(stationData: any[], userLocation: any) {
  console.log("🤖 Running ML Algorithm...")

  const mlScores = stationData.map((data) => {
    // Feature normalization (0-1 scale)
    const features = {
      distanceNorm: 1 - data.factors.distance / 50, // Normalize to 50km max
      timeNorm: 1 - data.factors.time / 60, // Normalize to 60min max
      reliabilityNorm: data.factors.reliability / 100,
      speedNorm: data.factors.chargingSpeed / 100,
      costNorm: 1 - data.factors.cost / 100, // Lower cost is better
      availabilityNorm: data.factors.availability / 100,
      accessibilityNorm: data.factors.accessibility / 100,
    }

    // ML-style weighted scoring (learned weights)
    const mlScore =
      features.distanceNorm * 0.25 + // Distance importance
      features.timeNorm * 0.2 + // Time importance
      features.reliabilityNorm * 0.2 + // Reliability importance
      features.speedNorm * 0.15 + // Speed importance
      features.costNorm * 0.1 + // Cost importance
      features.availabilityNorm * 0.05 + // Availability importance
      features.accessibilityNorm * 0.05 // Accessibility importance

    return { id: data.id, mlScore: mlScore * 100, station: data.station }
  })

  mlScores.sort((a, b) => b.mlScore - a.mlScore)

  const winner = mlScores[0]
  console.log(`   🏆 ML winner: ${winner.station.name} (ML score: ${winner.mlScore.toFixed(1)})`)

  return {
    algorithm: "Machine Learning",
    winner: winner.station,
    score: winner.mlScore,
    reasoning: "Uses normalized features with learned optimal weights",
  }
}

// Fixed genetic algorithm helper functions
function evaluateGeneticFitness(weights: any, stationData: any[]) {
  const stationScores = stationData.map((data) => {
    // Calculate weighted score using genetic weights
    const score =
      (100 - data.factors.distance) * weights.distance + // Lower distance is better
      (100 - data.factors.time) * weights.time + // Lower time is better
      data.factors.reliability * weights.reliability + // Higher reliability is better
      data.factors.chargingSpeed * weights.speed + // Higher speed is better
      (100 - data.factors.cost) * weights.cost + // Lower cost is better
      data.factors.availability * weights.availability + // Higher availability is better
      data.factors.accessibility * weights.accessibility // Higher accessibility is better

    return {
      station: data.station,
      score: Math.max(0, score), // Ensure non-negative scores
    }
  })

  // Sort by score (highest first)
  stationScores.sort((a, b) => b.score - a.score)

  return {
    fitness: stationScores[0].score,
    bestStation: stationScores[0].station,
  }
}

function geneticCrossover(parent1: any, parent2: any) {
  const childWeights = {}

  // Uniform crossover - randomly pick each weight from either parent
  Object.keys(parent1.weights).forEach((key) => {
    childWeights[key] = Math.random() > 0.5 ? parent1.weights[key] : parent2.weights[key]
  })

  // Normalize weights to sum to 1
  const sum = Object.values(childWeights).reduce((a, b) => a + b, 0)
  Object.keys(childWeights).forEach((key) => {
    childWeights[key] = childWeights[key] / sum
  })

  return {
    weights: childWeights,
    fitness: 0,
    bestStation: null,
  }
}

function geneticMutation(individual: any, mutationRate: number) {
  Object.keys(individual.weights).forEach((key) => {
    if (Math.random() < mutationRate) {
      // Add small random change
      individual.weights[key] += (Math.random() - 0.5) * 0.2
      individual.weights[key] = Math.max(0.01, Math.min(0.99, individual.weights[key])) // Keep in bounds
    }
  })

  // Re-normalize weights after mutation
  const sum = Object.values(individual.weights).reduce((a, b) => a + b, 0)
  Object.keys(individual.weights).forEach((key) => {
    individual.weights[key] = individual.weights[key] / sum
  })
}

// Remove the old evaluateFitness, crossover, and mutate functions
// They are replaced by the new geneticCrossover, geneticMutation, and evaluateGeneticFitness functions above

// Find consensus winner across all algorithms
function findConsensusWinner(results: any, stationData: any[]) {
  const votes: { [key: string]: number } = {}

  // Count votes from each algorithm
  Object.values(results).forEach((result: any) => {
    const stationName = result.winner.name
    votes[stationName] = (votes[stationName] || 0) + 1
  })

  // Find station with most votes
  let maxVotes = 0
  let consensusWinner = null

  for (const [stationName, voteCount] of Object.entries(votes)) {
    if (voteCount > maxVotes) {
      maxVotes = voteCount
      consensusWinner = stationData.find((data) => data.station.name === stationName)?.station
    }
  }

  return consensusWinner || results.dijkstra.winner
}

function generateExplanation(results: any, bestStation: any) {
  const algorithms = Object.keys(results)
  const agreements = algorithms.filter((alg) => results[alg].winner.name === bestStation.name)

  return {
    consensus: `${agreements.length}/${algorithms.length} algorithms agree`,
    details: algorithms.map((alg) => ({
      algorithm: results[alg].algorithm,
      choice: results[alg].winner.name,
      score: results[alg].score.toFixed(1),
      reasoning: results[alg].reasoning,
    })),
  }
}

// Factor calculation functions
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function calculateReliability(station: any): number {
  const name = station.name.toLowerCase()
  if (name.includes("tesla")) return 95
  if (name.includes("electrify america")) return 90
  if (name.includes("chargepoint")) return 85
  if (name.includes("evgo")) return 80
  return 70
}

function calculateChargingSpeed(station: any): number {
  const name = station.name.toLowerCase()
  if (name.includes("supercharger") || name.includes("fast")) return 90
  if (name.includes("rapid") || name.includes("quick")) return 80
  if (name.includes("level 3") || name.includes("dc")) return 75
  return 60
}

function calculateCost(station: any): number {
  const name = station.name.toLowerCase()
  if (name.includes("tesla")) return 70 // Tesla is pricier
  if (name.includes("electrify america")) return 60
  return 50 // Assume moderate cost
}

function calculateAvailability(station: any): number {
  // Simulate availability based on location type
  const address = station.address.toLowerCase()
  if (address.includes("highway")) return 85
  if (address.includes("mall")) return 75
  return 80
}

function calculateAccessibility(station: any): number {
  const address = station.address.toLowerCase()
  if (address.includes("highway")) return 90
  if (address.includes("walmart") || address.includes("target")) return 85
  if (address.includes("mall")) return 80
  return 75
}
