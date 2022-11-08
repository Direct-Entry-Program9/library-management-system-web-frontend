// const API_END_POINT = "http://34.131.127.29:8080/lms/api";
const API_END_POINT = "http://localhost:8080/lms/api";
const size = 3;
let page = 1;

getBooks();
function getBooks(){
    const http = new XMLHttpRequest();

    http.addEventListener('readystatechange',()=>{
        if(http.readyState === http.DONE){
            if(http.status === 200){
                const totalBooks = +http.getResponseHeader('X-Total-Count');
                initPagination(totalBooks);

                const books = JSON.parse(http.responseText);
                $('#loader').hide();
                if(books.length === 0 ){
                    $('#tbl-books').addClass('empty');
                }else{
                    $('#tbl-books').removeClass('empty');
                }
                $('#tbl-books tbody tr').remove();
                books.forEach(book => {
                    const rowHtml = `
                    <tr tabindex="0">
                        <td>${book.isbn}</td>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${book.copies}</td>
                    </tr>  
                    `
                    $('#tbl-books tbody').append(rowHtml);
                });
            }else{
                // showToast("Failed to reach server. Try Again....","error");
            }
        }
    });

    http.open('GET',`${API_END_POINT}/books?size=${size}&page=${page}`,true);
    
    http.send();
}

function initPagination(totalBooks){
    const totalPages = Math.ceil(totalBooks/size);

    if(totalPages <=1){
        $("#pagination").addClass('d-none');
    }else{
        $("#pagination").removeClass('d-none');
    }

    let html = '';
    for (let i=1; i<=totalPages; i++){
        html += `<li class="page-item ${i===page?'active':''}"><a class="page-link" href="#">${i}</a></li>`;
    }
    html = `
        <li class="page-item ${page === 1?'disabled':''}"><a class="page-link" href="#">Previous</a></li>
        ${html}
        <li class="page-item ${page === totalPages?'disabled':''}"><a class="page-link" href="#">Next</a></li>
    `;

    $('#pagination>.pagination').html(html);
}

// $('#pagination>.pagination').click((eventData)=>{
//     const elm = eventData.target;
//     console.log(elm);
    // if(elm && elm.tagName === 'A'){
    //     const activePage = ($(elm).text());
    //     if(activePage === 'Next'){
    //         page++;
    //         getBooks();
    //     }else if(activePage === 'Previous'){
    //         page--;
    //         getBooks();
    //     }else{
    //         if(page !== activePage){
    //             page = +activePage;
    //             getBooks();
    //         }
    //     }
    // }
// });