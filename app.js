let data = [];  // Placeholder for the actual data
let currentSearchTerm = '';  // Variable to store the current search term

function initializeTableColumns() {
    const tableHead = document.getElementById('videoTable').querySelector('thead');
    tableHead.style.display = 'table-header-group';
    addEventListeners();
}

function autocomplete(inp, arr) {
    let currentFocus;

    inp.addEventListener("input", function (e) {
        let a, b, i, val = this.value;

        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;

        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");

        this.parentNode.appendChild(a);

        for (i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";

                b.addEventListener("click", function (e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    currentSearchTerm = inp.value.toLowerCase();
                    renderTable(currentSearchTerm);
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });

    inp.addEventListener("keydown", function (e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        let x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function addEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');

    searchInput.addEventListener('input', function () {
        const searchTerm = searchInput.value.toLowerCase();
        const matchedItems = [];

        data.forEach(video => {
            if (video.title.toLowerCase().includes(searchTerm)) {
                matchedItems.push(video.title);
            }

            collectMatchingPills(video.themes, searchTerm, matchedItems);
            collectMatchingPills(video.topics, searchTerm, matchedItems);
            collectMatchingPills(video.people, searchTerm, matchedItems);
            collectMatchingPills(video.organizations, searchTerm, matchedItems);
            collectMatchingPills(video.channel, searchTerm, matchedItems);
            collectMatchingPills(video.speakers, searchTerm, matchedItems);
        });

        const uniqueMatchedItems = [...new Set(matchedItems)];
        autocomplete(searchInput, uniqueMatchedItems);
    });

    sortSelect.addEventListener('change', function () {
        renderTable(currentSearchTerm);
    });

    document.addEventListener('click', function (e) {
        const autoCompleteList = document.getElementById('searchInputautocomplete-list');
        if (autoCompleteList && !autoCompleteList.contains(e.target) && e.target !== searchInput) {
            autoCompleteList.style.display = 'none';
        }
    });
}

function collectMatchingPills(pills, searchTerm, matchedItems) {
    if (!pills) return;
    if (Array.isArray(pills)) {
        pills.forEach(item => {
            if (typeof item === 'string' && item.toLowerCase().includes(searchTerm)) {
                matchedItems.push(item);
            }
        });
    } else if (typeof pills === 'object') {
        Object.values(pills).flat().forEach(item => {
            if (typeof item === 'string' && item.toLowerCase().includes(searchTerm)) {
                matchedItems.push(item);
            }
        });
    }
}

function searchInPillsExact(pills, searchTerm) {
    if (!pills) return false;
    if (Array.isArray(pills)) {
        return pills.some(item => typeof item === 'string' && item.toLowerCase() === searchTerm);
    } else if (typeof pills === 'object') {
        return Object.values(pills).flat().some(item => typeof item === 'string' && item.toLowerCase() === searchTerm);
    }
    return false;
}

function searchInPillsPartial(pills, searchTerm) {
    if (!pills) return false;
    if (Array.isArray(pills)) {
        return pills.some(item => typeof item === 'string' && item.toLowerCase().includes(searchTerm));
    } else if (typeof pills === 'object') {
        return Object.values(pills).flat().some(item => typeof item === 'string' && item.toLowerCase().includes(searchTerm));
    }
    return false;
}

function getPillLabel(pills, searchTerm) {
    if (!pills) return '';
    if (Array.isArray(pills)) {
        const matchedPill = pills.find(item => typeof item === 'string' && item.toLowerCase() === searchTerm);
        return matchedPill || '';
    } else if (typeof pills === 'object') {
        const matchedPill = Object.values(pills).flat().find(item => typeof item === 'string' && item.toLowerCase() === searchTerm);
        return matchedPill || '';
    }
    return '';
}

function sortVideos(videos, sortBy) {
    switch (sortBy) {
        case 'newest':
            return videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        case 'oldest':
            return videos.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
        case 'mostViews':
            return videos.sort((a, b) => b.viewCount - a.viewCount);
        case 'mostLikes':
            return videos.sort((a, b) => b.likeCount - a.likeCount);
        default:
            return videos;
    }
}

function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function roundUpToMinutes(seconds) {
    return Math.ceil(seconds / 60);
}

function renderTable(searchTerm) {
    const tableBody = document.getElementById('videoTable').querySelector('tbody');
    tableBody.innerHTML = '';

    const sortSelect = document.getElementById('sortSelect');
    const sortBy = sortSelect.value;

    let matchedVideos = data.filter(video =>
        video.title.toLowerCase() === searchTerm.toLowerCase() ||
        searchInPillsExact(video.themes, searchTerm.toLowerCase()) ||
        searchInPillsExact(video.topics, searchTerm.toLowerCase()) ||
        searchInPillsExact(video.people, searchTerm.toLowerCase()) ||
        searchInPillsExact(video.organizations, searchTerm.toLowerCase()) ||
        searchInPillsExact(video.channel, searchTerm.toLowerCase()) ||
        searchInPillsExact(video.speakers, searchTerm.toLowerCase())
    );

    // If no exact matches found, fall back to partial matches
    if (matchedVideos.length === 0) {
        matchedVideos = data.filter(video =>
            video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            searchInPillsPartial(video.themes, searchTerm.toLowerCase()) ||
            searchInPillsPartial(video.topics, searchTerm.toLowerCase()) ||
            searchInPillsPartial(video.people, searchTerm.toLowerCase()) ||
            searchInPillsPartial(video.organizations, searchTerm.toLowerCase()) ||
            searchInPillsPartial(video.channel, searchTerm.toLowerCase()) ||
            searchInPillsPartial(video.speakers, searchTerm.toLowerCase())
        );
    }

    matchedVideos = sortVideos(matchedVideos, sortBy);

    matchedVideos.forEach(video => {
        const row = tableBody.insertRow();

        // Video Column
        const videoCell = row.insertCell(0);
        videoCell.innerHTML = `
            <div class="thumbnail-wrapper">
                <img src="${video.thumbnail}" alt="${video.title}" class="thumbnail">
                <div class="tooltiptext">${video.summary}</div>
                <p>
                    ${video.title}
                    <a href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank" class="link-arrow">&#8599;</a>
                    <br> <small>${video.publishedAt}</small>
                </p>
                <div>${createChipHTML(video.channel, searchTerm)}</div>
            </div>
        `;

        // Stats Column
        const statsCell = row.insertCell(1);
        statsCell.innerHTML = `
            <p>Views: ${formatNumberWithCommas(video.viewCount)}</p>
            <p>Likes: ${formatNumberWithCommas(video.likeCount)}</p>
            <p>Comments: ${formatNumberWithCommas(video.commentCount)}</p>
            <p>Duration (mins): ${roundUpToMinutes(video.duration)}</p>
        `;

        // Themes Column
        const themesCell = row.insertCell(2);
        themesCell.innerHTML = createChipHTML(video.themes, searchTerm);

        // Topics Column
        const topicsCell = row.insertCell(3);
        topicsCell.innerHTML = createChipHTML(video.topics, searchTerm);

        // People Column
        const peopleCell = row.insertCell(4);
        const allPeople = [...new Set([...(video.people || []), ...(video.speakers || [])])];
        peopleCell.innerHTML = createChipHTML(allPeople, searchTerm);

        // Organizations Column
        const organizationsCell = row.insertCell(5);
        organizationsCell.innerHTML = createChipHTML([...new Set(video.organizations || [])], searchTerm);
    });

    toggleInitialMessageAndTable();
    addPillClickListeners();
}


function createChipHTML(items, searchTerm) {
    if (!items) return '';
    if (typeof items === 'object') {
        return [...new Set(Object.values(items).flat())].map(item => {
            const isActive = searchTerm && typeof item === 'string' && item.toLowerCase() === searchTerm;
            return `<span class="chip ${isActive ? 'active' : ''}" data-value="${item}">${item}</span>`;
        }).join('');
    }
    return [...new Set(items)].map(item => {
        const isActive = searchTerm && typeof item === 'string' && item.toLowerCase() === searchTerm;
        return `<span class="chip ${isActive ? 'active' : ''}" data-value="${item}">${item}</span>`;
    }).join('');
}

function addPillClickListeners() {
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', function () {
            const value = this.getAttribute('data-value');
            document.getElementById('searchInput').value = value;
            currentSearchTerm = value.toLowerCase();
            renderTable(currentSearchTerm);
        });
    });
}

function toggleInitialMessageAndTable() {
    const searchInputValue = document.getElementById('searchInput').value.trim();
    const initialMessage = document.getElementById('initialMessage');
    const videoTable = document.getElementById('videoTable');

    if (searchInputValue) {
        initialMessage.style.display = 'none';
        videoTable.style.display = 'table';
    } else {
        initialMessage.style.display = 'block';
        videoTable.style.display = 'none';
    }
}

fetch('ai_ted_talks_videos.json')
    .then(response => response.json())
    .then(json => {
        data = json;
        initializeTableColumns();
        toggleInitialMessageAndTable();
        renderTable('');  // Render table with default sorting
    })
    .catch(err => console.error('Error fetching data:', err));