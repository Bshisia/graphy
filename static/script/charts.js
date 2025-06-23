export function createXPGraph(transactions) {
    const svg = document.getElementById('xp-graph');
    if (!svg) return;

    svg.innerHTML = '';

    // Filter and sort XP transactions
    const sortedXP = transactions
        .filter(tx => tx.type === 'xp')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (sortedXP.length === 0) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '250');
        text.setAttribute('y', '125');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '16');
        text.setAttribute('fill', '#6b7280');
        text.textContent = 'No XP data available';
        svg.appendChild(text);
        return;
    }

    // Calculate cumulative XP points
    let cumulativeXP = 0;
    const points = sortedXP.map((tx, i) => {
        cumulativeXP += tx.amount;
        return {
            x: 80 + (i * 360 / Math.max(sortedXP.length - 1, 1)),
            y: cumulativeXP,
            date: new Date(tx.createdAt),
            projectName: tx.object?.name || 'Project'
        };
    });

    const maxXP = Math.max(...points.map(p => p.y));

    // Scale points to SVG coordinates (leave space for axes)
    const scaledPoints = points.map(p => ({
        x: p.x,
        y: 50 + (130 - ((p.y / maxXP) * 130)),
        originalY: p.y,
        date: p.date,
        projectName: p.projectName
    }));

    // Draw grid lines and Y-axis labels
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const yValue = (maxXP / ySteps) * i;
        const yPos = 180 - ((yValue / maxXP) * 130);

        // Horizontal grid line
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', '80');
        gridLine.setAttribute('y1', yPos);
        gridLine.setAttribute('x2', '440');
        gridLine.setAttribute('y2', yPos);
        gridLine.setAttribute('stroke', '#e5e7eb');
        gridLine.setAttribute('stroke-width', '1');
        svg.appendChild(gridLine);

        // Y-axis label
        const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yLabel.setAttribute('x', '75');
        yLabel.setAttribute('y', yPos + 4);
        yLabel.setAttribute('text-anchor', 'end');
        yLabel.setAttribute('font-size', '10');
        yLabel.setAttribute('fill', '#6b7280');
        yLabel.textContent = Math.round(yValue / 1000) + 'k';
        svg.appendChild(yLabel);
    }

    // Draw X-axis labels (dates)
    const xSteps = Math.min(5, points.length - 1);
    for (let i = 0; i <= xSteps; i++) {
        const pointIndex = Math.round((points.length - 1) * (i / xSteps));
        const point = points[pointIndex];
        const xPos = 80 + (i * 360 / xSteps);

        // Vertical grid line
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', xPos);
        gridLine.setAttribute('y1', '50');
        gridLine.setAttribute('x2', xPos);
        gridLine.setAttribute('y2', '180');
        gridLine.setAttribute('stroke', '#e5e7eb');
        gridLine.setAttribute('stroke-width', '1');
        svg.appendChild(gridLine);

        // X-axis label
        const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabel.setAttribute('x', xPos);
        xLabel.setAttribute('y', '195');
        xLabel.setAttribute('text-anchor', 'middle');
        xLabel.setAttribute('font-size', '10');
        xLabel.setAttribute('fill', '#6b7280');
        xLabel.textContent = point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        svg.appendChild(xLabel);
    }

    // Draw axes
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', '80');
    yAxis.setAttribute('y1', '50');
    yAxis.setAttribute('x2', '80');
    yAxis.setAttribute('y2', '180');
    yAxis.setAttribute('stroke', '#374151');
    yAxis.setAttribute('stroke-width', '2');
    svg.appendChild(yAxis);

    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', '80');
    xAxis.setAttribute('y1', '180');
    xAxis.setAttribute('x2', '440');
    xAxis.setAttribute('y2', '180');
    xAxis.setAttribute('stroke', '#374151');
    xAxis.setAttribute('stroke-width', '2');
    svg.appendChild(xAxis);

    // Create XP line
    if (scaledPoints.length > 0) {
        const pathData = scaledPoints.map((p, i) =>
            (i === 0 ? 'M' : 'L') + p.x + ',' + p.y
        ).join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#8b5cf6');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);

        // Add dots at data points
        scaledPoints.forEach((p, i) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#8b5cf6');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '2');
            svg.appendChild(circle);
        });
    }

    // Add axis labels
    const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yAxisLabel.setAttribute('x', '20');
    yAxisLabel.setAttribute('y', '115');
    yAxisLabel.setAttribute('text-anchor', 'middle');
    yAxisLabel.setAttribute('font-size', '12');
    yAxisLabel.setAttribute('fill', '#374151');
    yAxisLabel.setAttribute('transform', 'rotate(-90, 20, 115)');
    yAxisLabel.textContent = 'XP (thousands)';
    svg.appendChild(yAxisLabel);

    const xAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xAxisLabel.setAttribute('x', '260');
    xAxisLabel.setAttribute('y', '220');
    xAxisLabel.setAttribute('text-anchor', 'middle');
    xAxisLabel.setAttribute('font-size', '12');
    xAxisLabel.setAttribute('fill', '#374151');
    xAxisLabel.textContent = 'Time';
    svg.appendChild(xAxisLabel);
}

export function createProjectsPieChart(projects) {
    const svg = document.getElementById('projects-chart');
    if (!svg) return;

    svg.innerHTML = '';

    if (projects.length === 0) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '100');
        text.setAttribute('y', '100');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', '16');
        text.setAttribute('fill', '#6b7280');
        text.textContent = 'No projects data';
        svg.appendChild(text);
        return;
    }

    const passed = projects.filter(p => p.grade && p.grade >= 1).length;
    const total = projects.length;
    const percentage = total > 0 ? (passed / total) * 100 : 0;

    // Create background circle
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', '100');
    bgCircle.setAttribute('cy', '100');
    bgCircle.setAttribute('r', '80');
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', '#e5e7eb');
    bgCircle.setAttribute('stroke-width', '20');
    svg.appendChild(bgCircle);

    // Create progress circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '100');
    circle.setAttribute('cy', '100');
    circle.setAttribute('r', '80');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#8b5cf6');
    circle.setAttribute('stroke-width', '20');
    circle.setAttribute('stroke-linecap', 'round');
    circle.setAttribute('transform', 'rotate(-90 100 100)');

    const circumference = 2 * Math.PI * 80;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    circle.setAttribute('stroke-dasharray', strokeDasharray);
    svg.appendChild(circle);

    // Add percentage text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '100');
    text.setAttribute('y', '105');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '24');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#4b5563');
    text.textContent = `${Math.round(percentage)}%`;
    svg.appendChild(text);

    // Add label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '100');
    label.setAttribute('y', '125');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('font-size', '12');
    label.setAttribute('fill', '#6b7280');
    label.textContent = `${passed}/${total} passed`;
    svg.appendChild(label);
}
