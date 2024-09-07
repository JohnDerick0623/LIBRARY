// Import ipcRenderer from Electron
const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {

    // Sidebar toggle functionality
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', function () {
            const wrapper = document.getElementById('wrapper');
            const sidebar = document.getElementById('sidebar-wrapper');
            if (wrapper && sidebar) {
                wrapper.classList.toggle('collapsed');
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    // LOGOUT
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link behavior

            ipcRenderer.invoke('logout').then(() => {
                window.location.href = './login/login.html'; // Redirect to login page after logout
            }).catch(error => {
                console.error('Error during logout:', error);
                alert('An error occurred. Please try again.');
            });
        });
    }

    // ADD Book button functionality
    const addBookButton = document.getElementById('add-book-button');
    if (addBookButton) {
        addBookButton.addEventListener('click', function () {
            ipcRenderer.send('open-add-book-from-index-window');
        });
    }
    

    // Listen for book addition and update the table and dashboard accordingly
    ipcRenderer.on('book-record-added', (event, newBook) => {
        addBookToTable(newBook);  // Add the new book to the table at the top
        updateDashboard(newBook); // Optionally update other parts of the dashboard
    });

    // Function to add a new book to the table at the top
    function addBookToTable(book) {
        const booksList = document.getElementById('books-list');
        if (booksList) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.number}</td>
                <td>${book.title_of_book}</td>
                <td>${book.author}</td>
            `;
            // Add the new row at the top of the table
            booksList.prepend(row);
        }
    }

    // Fetch total number of books and update the display
    ipcRenderer.invoke('getBooks').then((books) => {
        const totalBooks = books.length;
        const totalBooksCountElement = document.getElementById('total-books-count');
        if (totalBooksCountElement) {
            totalBooksCountElement.textContent = totalBooks;
        }
    }).catch((error) => {
        console.error('Error fetching total books:', error);
    });

    // Handle click event to redirect to books page
    const totalBooksLink = document.getElementById('total-books-link');
    if (totalBooksLink) {
        totalBooksLink.addEventListener('click', (e) => {
            e.preventDefault();
            ipcRenderer.send('open-books-page');
        });
    }

    const viewAllBooksLink = document.getElementById('view-all-books');
    if (viewAllBooksLink) {
        viewAllBooksLink.addEventListener('click', (e) => {
            e.preventDefault();
            ipcRenderer.send('open-books-page');
        });
    }

    // Fetch books and display them in the table
    ipcRenderer.invoke('getBooks').then((books) => {
        const booksList = document.getElementById('books-list');
        if (booksList) {
            // Limit the number of books displayed in the index
            const limitedBooks = books.slice(0, 5); // Adjust this limit as needed

            // Clear the existing table content
            booksList.innerHTML = '';

            // Display the most recent books at the top
            limitedBooks.forEach((book) => {
                addBookToTable(book);
            });
        }
    }).catch((error) => {
        console.error('Error fetching books:', error);
    });

    // Fetch total number of borrowed books and update the display
    function updateBorrowedBooksCount() {
        ipcRenderer.invoke('getBorrowedBooksCount').then((borrowedBooksCount) => {
            const totalCountElement = document.getElementById('totalCount');
            if (totalCountElement) {
                totalCountElement.textContent = borrowedBooksCount;
            }
        }).catch((error) => {
            console.error('Error updating borrowed books count:', error);
        });
    }

    // Call updateBorrowedBooksCount when the page loads
    updateBorrowedBooksCount(); // Fetch and display borrowed books count on page load

    // Fetch total number of unique borrowers and update the display
    ipcRenderer.invoke('getUniqueBorrowers').then((uniqueBorrowers) => {
        const totalBorrowers = uniqueBorrowers.length;
        const totalBorrowersCountElement = document.getElementById('total-borrowers-count');
        if (totalBorrowersCountElement) {
            totalBorrowersCountElement.textContent = totalBorrowers;
        }
    }).catch((error) => {
        console.error('Error fetching unique borrowers:', error);
    });


// PIECHART
// Fetch data for the pie chart
Promise.all([
    ipcRenderer.invoke('getBooksCount'),
    ipcRenderer.invoke('getBorrowedBooksCount'),
    ipcRenderer.invoke('getUniqueBorrowers')
]).then(([totalBooks, totalBorrowedBooks, uniqueBorrowers]) => {
    const totalUniqueBorrowers = uniqueBorrowers.length;

    // Create the pie chart
    const ctx = document.getElementById('libraryPieChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Books', 'Borrowed Books', 'Unique Borrowers'],
            datasets: [{
                label: 'Library Statistics',
                data: [totalBooks, totalBorrowedBooks, totalUniqueBorrowers],
                backgroundColor: ['#30688B', '#767676', '#F7F7F7'],
                hoverOffset: 4,
                borderColor: '#666', // Set border color
                borderWidth: 1, // Set border width to 1px
                hoverOffset: 4,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true, // Use circle shape
                        pointStyle: 'circle', // Define the shape as a circle
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.label + ': ' + tooltipItem.raw;
                        }
                    }
                }
            }
        }
    });
}).catch((error) => {
    console.error('Error fetching data for pie chart:', error);
});

async function fetchBooksCount() {
    try {
        const count = await ipcRenderer.invoke('getBooksCount');
        // Use the count value for your pie chart or any other logic
        console.log(`Number of books: ${count}`);
    } catch (error) {
        console.error('Error fetching data for pie chart:', error);
    }
}

fetchBooksCount();

});
