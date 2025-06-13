export function generateXPGraph(
  allTransactions,
  courseStartDate,
  courseEndDate
) {
  const transactions = allTransactions.filter(
    (transaction) => transaction.type === "xp"
  );
  const startDate = new Date(courseStartDate);
  const endDate = new Date(courseEndDate);
  const currentDate = new Date();

  const xAxisEndDate = currentDate < endDate ? currentDate : endDate;

  let cumulativeXP = 0;
  const dataPoints = transactions.map((transaction) => {
    const date = new Date(transaction.createdAt);
    cumulativeXP += transaction.amount;
    return { date, xp: cumulativeXP };
  });

  if (dataPoints.length === 0 || dataPoints[0].date > startDate) {
    dataPoints.unshift({ date: startDate, xp: 0 });
  }
  if (
    dataPoints.length > 0 &&
    dataPoints[dataPoints.length - 1].date < xAxisEndDate
  ) {
    dataPoints.push({
      date: xAxisEndDate,
      xp: dataPoints[dataPoints.length - 1].xp,
    });
  }

  const svgWidth = 800;
  const svgHeight = 500;
  const margin = { top: 80, right: 50, bottom: 70, left: 100 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.bottom - margin.top;

  const dateRange = xAxisEndDate - startDate;

  const dateToX = (date) => {
    return margin.left + (chartWidth * (date - startDate)) / dateRange;
  };
  const maxXP = Math.max(...dataPoints.map((p) => p.xp));
  const roundedMaxXP = Math.ceil(maxXP / 50000) * 50000;

  const xpToY = (xp) => {
    return margin.top + chartHeight - (chartHeight * xp) / roundedMaxXP;
  };

  // Generate x-axis labels - calculate good intervals
  const monthInterval = Math.max(
    1,
    Math.ceil(dateRange / (1000 * 60 * 60 * 24 * 30 * 6))
  );
  const xAxisLabels = [];
  let currentLabel = new Date(startDate);

  while (currentLabel <= xAxisEndDate) {
    xAxisLabels.push({
      date: new Date(currentLabel),
      x: dateToX(currentLabel),
      label: currentLabel.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    });

    // Move to next month based on calculated interval
    currentLabel = new Date(currentLabel);
    currentLabel.setMonth(currentLabel.getMonth() + monthInterval);
  }

  // Ensure the last label is the end date
  if (
    xAxisLabels.length > 0 &&
    xAxisLabels[xAxisLabels.length - 1].date < xAxisEndDate
  ) {
    xAxisLabels.push({
      date: xAxisEndDate,
      x: dateToX(xAxisEndDate),
      label: xAxisEndDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    });
  }
  // Generate y-axis labels
  const yAxisLabels = [];
  const stepSize = roundedMaxXP / 8;

  for (let i = 0; i <= 8; i++) {
    const yp = stepSize * i;
    yAxisLabels.push({
      xp: yp,
      y: xpToY(yp),
      label: formatXP(yp),
    });
  }

  // Generate polyline points for the graph
  const polylinePoints = dataPoints
    .map((point) => {
      return `${dateToX(point.date)},${xpToY(point.xp)}`;
    })
    .join(" ");

  // Generate path for area under the curve
  const areaPath = `
    M${dataPoints
      .map((point) => `${dateToX(point.date)},${xpToY(point.xp)}`)
      .join(" L")}
    L${dateToX(dataPoints[dataPoints.length - 1].date)},${xpToY(0)} 
    L${dateToX(dataPoints[0].date)},${xpToY(0)} Z`;

  const svg = `<svg class="chart-container" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
    <!-- Background and styling -->
    <defs>
      <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#334155" />
      </linearGradient>
      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.05" />
      </linearGradient>
      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#f59e0b" />
      </linearGradient>
      <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
        <feOffset dx="0" dy="2" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.2" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- Main background -->
    <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" rx="10" ry="10" fill="url(#backgroundGradient)" />

    <!-- Chart area background -->
    <rect x="${margin.left - 70}" y="${margin.top - 10}" width="${
    chartWidth + 100
  }" height="${
    chartHeight + 40
  }" rx="8" ry="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1" stroke-opacity="0.3" filter="url(#drop-shadow)" />

    <!-- Y-axis -->
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${
    margin.top + chartHeight
  }" stroke="#64748b" stroke-width="1" />

    <!-- Y-axis labels and grid lines -->
    ${yAxisLabels
      .map(
        (label) => `
      <line x1="${margin.left - 2}" y1="${label.y}" x2="${
          margin.left + chartWidth
        }" y2="${
          label.y
        }" stroke="#475569" stroke-width="1" stroke-dasharray="5,5" />
      <text x="${margin.left - 10}" y="${
          label.y + 5
        }" font-family="Segoe UI, sans-serif" font-size="12" fill="#94a3b8" text-anchor="end">
        ${label.label}
      </text>
    `
      )
      .join("")}

    <!-- X-axis -->
    <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${
    margin.left + chartWidth
  }" y2="${margin.top + chartHeight}" stroke="#64748b" stroke-width="1" />

    <!-- X-axis labels -->
    ${xAxisLabels
      .map(
        (label) => `
      <text x="${label.x}" y="${
          margin.top + chartHeight + 25
        }" font-family="Segoe UI, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">
        ${label.label}
      </text>
    `
      )
      .join("")}

    <!-- Area under the curve -->
    <path d="${areaPath}" fill="url(#areaGradient)" />

    <!-- Actual progression line with data points -->
    <polyline points="${polylinePoints}" fill="none" stroke="url(#lineGradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Data points -->
    ${dataPoints
      .map((point, index) => {
        const x = dateToX(point.date);
        const y = xpToY(point.xp);

        // Only show a limited number of data points to avoid clutter
        if (
          index % Math.max(1, Math.floor(dataPoints.length / 10)) === 0 ||
          index === dataPoints.length - 1
        ) {
          return `<circle cx="${x}" cy="${y}" r="${
            index === dataPoints.length - 1 ? 8 : 6
          }"
                fill="${
                  index === dataPoints.length - 1 ? "#f59e0b" : "#1e293b"
                }"
                stroke="${
                  index === dataPoints.length - 1 ? "#1e293b" : "#f59e0b"
                }"
                stroke-width="2" ${
                  index === dataPoints.length - 1
                    ? '<animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />'
                    : ""
                } />`;
        }
        return "";
      })
      .join("")}

    <!-- Highlighted latest point label -->
    <rect x="${dateToX(dataPoints[dataPoints.length - 1].date) - 50}" y="${
    xpToY(dataPoints[dataPoints.length - 1].xp) - 40
  }" width="100" height="30" rx="5" ry="5" fill="#f59e0b" />
    <text x="${dateToX(dataPoints[dataPoints.length - 1].date)}" y="${
    xpToY(dataPoints[dataPoints.length - 1].xp) - 20
  }" font-family="Segoe UI, sans-serif" font-size="14" fill="#1e293b" text-anchor="middle">
      ${formatXP(dataPoints[dataPoints.length - 1].xp)}
    </text>
  </svg>`;
  return svg;
}

function formatXP(xp) {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}MB`;
  } else if (xp >= 1000) {
    const kbValue = xp / 1000;
    return kbValue % 1 === 0
      ? `${Math.floor(kbValue)}kB`
      : `${kbValue.toFixed(1)}kB`;
  }
  return xp.toString();
}

// Audit Ratio Pie Chart
export function generateAuditRatioPieChart(auditRatio, totalUp = 0, totalDown = 0) {
  // Handle edge cases
  if (auditRatio === null || auditRatio === undefined || isNaN(auditRatio)) {
    auditRatio = 0;
  }

  const svgSize = 400;
  const radius = 120;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  // Calculate percentages
  const successRate = Math.max(0, Math.min(1, auditRatio)); // Clamp between 0 and 1
  const failureRate = 1 - successRate;

  // Calculate total audits for display
  const totalAudits = totalUp + totalDown;

  // Handle case where there are no audits
  if (totalAudits === 0) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" class="audit-pie-chart">
        <rect x="0" y="0" width="${svgSize}" height="${svgSize}" rx="10" fill="#1e293b"/>
        <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="#334155" stroke="#475569" stroke-width="2"/>
        <text x="${centerX}" y="${centerY - 10}" text-anchor="middle" font-family="Poppins, sans-serif" font-size="18" font-weight="700" fill="#94a3b8">
          No Audits
        </text>
        <text x="${centerX}" y="${centerY + 15}" text-anchor="middle" font-family="Poppins, sans-serif" font-size="14" fill="#64748b">
          Data Available
        </text>
      </svg>
    `;
  }

  // Calculate angles (in radians)
  const successAngle = successRate * 2 * Math.PI;
  const failureAngle = failureRate * 2 * Math.PI;

  // Calculate arc paths
  const successPath = createArcPath(centerX, centerY, radius, 0, successAngle);
  const failurePath = createArcPath(centerX, centerY, radius, successAngle, successAngle + failureAngle);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" class="audit-pie-chart">
      <defs>
        <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#059669" />
        </linearGradient>
        <linearGradient id="failureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="100%" stop-color="#dc2626" />
        </linearGradient>
        <filter id="pieDropShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="2" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background circle -->
      <circle cx="${centerX}" cy="${centerY}" r="${radius + 10}" fill="#1e293b" stroke="#475569" stroke-width="2"/>

      <!-- Success arc -->
      <path d="${successPath}" fill="url(#successGradient)" stroke="#fff" stroke-width="3" filter="url(#pieDropShadow)" class="pie-slice">
        <animate attributeName="stroke-dasharray" values="0 1000;${successAngle * radius} 1000" dur="1.5s" fill="freeze"/>
        <title>Successful Audits: ${totalUp} (${(successRate * 100).toFixed(1)}%)</title>
      </path>

      <!-- Failure arc -->
      <path d="${failurePath}" fill="url(#failureGradient)" stroke="#fff" stroke-width="3" filter="url(#pieDropShadow)" class="pie-slice">
        <animate attributeName="stroke-dasharray" values="0 1000;${failureAngle * radius} 1000" dur="1.5s" begin="0.5s" fill="freeze"/>
        <title>Failed Audits: ${totalDown} (${(failureRate * 100).toFixed(1)}%)</title>
      </path>

      <!-- Center circle -->
      <circle cx="${centerX}" cy="${centerY}" r="60" fill="#1e293b" stroke="#475569" stroke-width="2"/>

      <!-- Center text -->
      <text x="${centerX}" y="${centerY - 15}" text-anchor="middle" font-family="Poppins, sans-serif" font-size="20" font-weight="700" fill="#f59e0b">
        ${(successRate * 100).toFixed(1)}%
      </text>
      <text x="${centerX}" y="${centerY + 5}" text-anchor="middle" font-family="Poppins, sans-serif" font-size="12" fill="#94a3b8">
        Success Rate
      </text>
      <text x="${centerX}" y="${centerY + 20}" text-anchor="middle" font-family="Poppins, sans-serif" font-size="11" fill="#64748b">
        ${totalAudits} total audits
      </text>

      <!-- Legend -->
      <g transform="translate(${svgSize - 140}, 50)">
        <rect x="0" y="0" width="15" height="15" fill="url(#successGradient)" rx="3"/>
        <text x="25" y="12" font-family="Poppins, sans-serif" font-size="12" fill="#e2e8f0">Success: ${totalUp}</text>

        <rect x="0" y="25" width="15" height="15" fill="url(#failureGradient)" rx="3"/>
        <text x="25" y="37" font-family="Poppins, sans-serif" font-size="12" fill="#e2e8f0">Failure: ${totalDown}</text>

        <text x="0" y="55" font-family="Poppins, sans-serif" font-size="11" fill="#94a3b8">Total: ${totalAudits}</text>
      </g>

      <!-- Title -->
      <text x="${centerX}" y="30" font-family="Poppins, sans-serif" font-size="18" font-weight="700" fill="#f59e0b" text-anchor="middle">
        Audit Performance
      </text>
    </svg>
  `;
}

// Helper function to create arc paths
function createArcPath(centerX, centerY, radius, startAngle, endAngle) {
  const startX = centerX + radius * Math.cos(startAngle - Math.PI / 2);
  const startY = centerY + radius * Math.sin(startAngle - Math.PI / 2);
  const endX = centerX + radius * Math.cos(endAngle - Math.PI / 2);
  const endY = centerY + radius * Math.sin(endAngle - Math.PI / 2);

  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

  return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
}

// Project Success Rate Bar Chart
export function generateProjectSuccessChart(projectStats) {
  // Handle edge cases
  if (!projectStats || typeof projectStats !== 'object') {
    projectStats = { go: { done: 0, total: 1 }, javascript: { done: 0, total: 1 }, rust: { done: 0, total: 1 } };
  }

  const svgWidth = 600;
  const svgHeight = 400;
  const margin = { top: 60, right: 50, bottom: 80, left: 80 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  const languages = ['Go', 'JavaScript', 'Rust'];
  const gradients = [
    ['#3b82f6', '#1d4ed8'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626']
  ];

  const barWidth = chartWidth / (languages.length * 2);

  const yScale = (value) => margin.top + chartHeight - (chartHeight * value / 100);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" class="project-success-chart">
      <defs>
        ${gradients.map((gradient, index) => `
          <linearGradient id="barGradient${index}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${gradient[0]}" />
            <stop offset="100%" stop-color="${gradient[1]}" />
          </linearGradient>
        `).join('')}
        <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" rx="10" fill="#1e293b"/>

      <!-- Chart background -->
      <rect x="${margin.left - 20}" y="${margin.top - 20}" width="${chartWidth + 40}" height="${chartHeight + 40}" rx="8" fill="#334155" stroke="#475569" stroke-width="1" filter="url(#barShadow)"/>

      <!-- Y-axis -->
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#64748b" stroke-width="2"/>

      <!-- Y-axis labels -->
      ${[0, 25, 50, 75, 100].map(value => `
        <line x1="${margin.left - 5}" y1="${yScale(value)}" x2="${margin.left + chartWidth}" y2="${yScale(value)}" stroke="#475569" stroke-width="1"/>
        <text x="${margin.left - 10}" y="${yScale(value) + 5}" font-family="Poppins, sans-serif" font-size="12" fill="#94a3b8" text-anchor="end">${value}%</text>
      `).join('')}

      <!-- X-axis -->
      <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" stroke="#64748b" stroke-width="2"/>

      <!-- Bars -->
      ${languages.map((lang, index) => {
        const stats = projectStats[lang.toLowerCase()] || { done: 0, total: 1 };
        const percentage = (stats.done / stats.total) * 100;
        const barHeight = (chartHeight * percentage) / 100;
        const x = margin.left + (index + 0.5) * (chartWidth / languages.length) - barWidth / 2;
        const y = margin.top + chartHeight - barHeight;

        return `
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}"
                fill="url(#barGradient${index})" rx="4" filter="url(#barShadow)">
            <animate attributeName="height" values="0;${barHeight}" dur="1s" begin="${index * 0.2}s" fill="freeze"/>
            <animate attributeName="y" values="${margin.top + chartHeight};${y}" dur="1s" begin="${index * 0.2}s" fill="freeze"/>
          </rect>

          <!-- Value labels -->
          <text x="${x + barWidth / 2}" y="${y - 10}" font-family="Poppins, sans-serif" font-size="14" font-weight="600" fill="#e2e8f0" text-anchor="middle">
            ${percentage.toFixed(1)}%
          </text>

          <!-- Language labels -->
          <text x="${x + barWidth / 2}" y="${margin.top + chartHeight + 25}" font-family="Poppins, sans-serif" font-size="14" font-weight="600" fill="#e2e8f0" text-anchor="middle">
            ${lang}
          </text>

          <!-- Project count -->
          <text x="${x + barWidth / 2}" y="${margin.top + chartHeight + 45}" font-family="Poppins, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">
            ${stats.done}/${stats.total}
          </text>
        `;
      }).join('')}

      <!-- Title -->
      <text x="${svgWidth / 2}" y="30" font-family="Poppins, sans-serif" font-size="18" font-weight="700" fill="#f59e0b" text-anchor="middle">
        Project Success Rate by Language
      </text>
    </svg>
  `;
}

// Skills Radar Chart
export function generateSkillsRadarChart(skills) {
  // Handle edge cases
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    skills = [
      { type: 'Programming', amount: 50 },
      { type: 'Problem Solving', amount: 40 },
      { type: 'Algorithms', amount: 35 }
    ];
  }

  const svgSize = 500;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const maxRadius = 180;

  // Take top 6 skills for better visualization
  const topSkills = skills.slice(0, 6);
  const maxSkillValue = Math.max(...topSkills.map(skill => skill.amount), 1); // Ensure at least 1

  // Calculate angles for each skill (evenly distributed)
  const angleStep = (2 * Math.PI) / topSkills.length;

  // Generate radar grid (concentric circles)
  const gridLevels = 5;
  const gridCircles = Array.from({ length: gridLevels }, (_, i) => {
    const radius = (maxRadius * (i + 1)) / gridLevels;
    return `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#475569" stroke-width="1" opacity="0.5"/>`;
  }).join('');

  // Generate radar axes
  const radarAxes = topSkills.map((skill, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    const endX = centerX + maxRadius * Math.cos(angle);
    const endY = centerY + maxRadius * Math.sin(angle);

    return `
      <line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#64748b" stroke-width="1" opacity="0.7"/>
      <text x="${centerX + (maxRadius + 20) * Math.cos(angle)}" y="${centerY + (maxRadius + 20) * Math.sin(angle) + 5}"
            font-family="Poppins, sans-serif" font-size="12" font-weight="600" fill="#e2e8f0" text-anchor="middle">
        ${skill.type}
      </text>
      <text x="${centerX + (maxRadius + 35) * Math.cos(angle)}" y="${centerY + (maxRadius + 35) * Math.sin(angle) + 5}"
            font-family="Poppins, sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">
        ${skill.amount}%
      </text>
    `;
  }).join('');

  // Generate skill data points
  const skillPoints = topSkills.map((skill, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const radius = (skill.amount / maxSkillValue) * maxRadius;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y, skill };
  });

  // Create the skill polygon path
  const skillPath = skillPoints.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  // Create skill points
  const skillCircles = skillPoints.map((point, index) => `
    <circle cx="${point.x}" cy="${point.y}" r="6" fill="#f59e0b" stroke="#1e293b" stroke-width="2">
      <animate attributeName="r" values="0;6" dur="0.8s" begin="${index * 0.1}s" fill="freeze"/>
    </circle>
  `).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" class="skills-radar-chart">
      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.1" />
        </linearGradient>
        <filter id="radarShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <rect x="0" y="0" width="${svgSize}" height="${svgSize}" rx="10" fill="#1e293b"/>

      <!-- Chart background -->
      <circle cx="${centerX}" cy="${centerY}" r="${maxRadius + 30}" fill="#334155" stroke="#475569" stroke-width="1" filter="url(#radarShadow)"/>

      <!-- Grid circles -->
      ${gridCircles}

      <!-- Radar axes -->
      ${radarAxes}

      <!-- Skill area -->
      <path d="${skillPath}" fill="url(#radarGradient)" stroke="#f59e0b" stroke-width="2" opacity="0.8">
        <animate attributeName="stroke-dasharray" values="0 1000;${skillPoints.length * 50} 0" dur="2s" fill="freeze"/>
      </path>

      <!-- Skill points -->
      ${skillCircles}

      <!-- Title -->
      <text x="${centerX}" y="40" font-family="Poppins, sans-serif" font-size="18" font-weight="700" fill="#f59e0b" text-anchor="middle">
        Top Skills Overview
      </text>

      <!-- Center label -->
      <text x="${centerX}" y="${centerY + 5}" font-family="Poppins, sans-serif" font-size="12" font-weight="600" fill="#f59e0b" text-anchor="middle">
        Skills
      </text>
    </svg>
  `;
}
