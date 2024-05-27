document.addEventListener("DOMContentLoaded", () => {
    const taskFilter = document.getElementById("taskFilter") || { value: "AVG" };
    const scoreHeader = document.getElementById("scoreHeader");
    const leaderboard = document.querySelector("tbody");

    // Populate the filter options
    const tasks = Object.keys(data[0]).slice(2);
    tasks.forEach(task => {
        const option = document.createElement("option");
        option.value = task;
        option.textContent = task;
        taskFilter.appendChild(option);
    });

    // Update the leaderboard when the filter is changed
    taskFilter.addEventListener("change", updateLeaderboard);

    // Initial load with default value
    taskFilter.value = "AVG";
    updateLeaderboard();

    function updateLeaderboard() {
        const selectedTask = taskFilter.value;
        scoreHeader.textContent = `ELO (${selectedTask})`;

        const sortedData = [...data].sort((a, b) => b[selectedTask] - a[selectedTask]);

        leaderboard.innerHTML = "";

        sortedData.forEach((row, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${getMedal(index)}${row.model}</td>
                <td>${row.training}</td>
                <td>${row[selectedTask]}</td>
            `;
            leaderboard.appendChild(tr);
        });
    }

    function getMedal(index) {
        switch(index) {
            case 0: return ' <span class="medal gold">🥇</span>';
            case 1: return ' <span class="medal silver">🥈</span>';
            case 2: return ' <span class="medal bronze">🥉</span>';
            default: return '';
        }
    }
});
document.addEventListener("DOMContentLoaded", () => {
    const copyButton = document.getElementById("copyButton");
    const bibtex = document.getElementById("bibtex").innerText;

    copyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(bibtex).then(() => {
            alert("BibTeX entry copied to clipboard!");
        }).catch(err => {
            console.error("Error copying text: ", err);
        });
    });
});
