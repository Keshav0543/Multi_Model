function cosineCalculation(query, vector) {
    // 1. Ensure vectors are the same length
    if (query.length !== vector.length) {
        throw new Error("Vectors must have the same number of dimensions.");
    }

    let dot = 0;
    let mag1 = 0;
    let mag2 = 0;

    // 2. Combine into a single loop for better performance
    for (let i = 0; i < query.length; i++) {
        dot += query[i] * vector[i];
        mag1 += query[i] * query[i];
        mag2 += vector[i] * vector[i];
    }

    // 3. Handle potential division by zero
    if (mag1 === 0 || mag2 === 0) {
        return 0; // Return 0 similarity if either vector is empty/zeroed out
    }

    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

export default cosineCalculation;
