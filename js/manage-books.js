const API_END_POINT = "http://34.131.127.29:8080/lms/api";
// const API_END_POINT = "http://localhost:8080/lms/api";
const size = 3;
let page = 1;

getBooks();
async function getBooks(query=`${$("#txt-search").val()}`){

    const response = await fetch(`${API_END_POINT}/books?size=${size}&page=${page}&q=${query}`)

    if (response.status === 200){
        const books = await response.json();

        const totalBooks = response.headers.get('X-Total-Count');
        initPagination(totalBooks);
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
        showToast("Failed to reach server. Try Again....","error");
    }
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

$('#pagination>.pagination').click((eventData)=>{
    const elm = eventData.target;
    if(elm && elm.tagName === 'A'){
        const activePage = ($(elm).text());
        if(activePage === 'Next'){
            page++;
            getBooks();
        }else if(activePage === 'Previous'){
            page--;
            getBooks();
        }else{
            if(page !== activePage){
                page = +activePage;
                getBooks();
            }
        }
    }
});

$('#txt-search').on('input',()=>{
    page = 1;
    getBooks();
});

$('#tbl-books tbody').keyup((eventData)=>{
    if(eventData.which === 38){
        const elm = document.activeElement.previousElementSibling;
        if (elm instanceof HTMLTableRowElement){
            elm.focus();
        }
    }else if(eventData.which === 40){
        const elm = document.activeElement.nextElementSibling;
        if(elm instanceof HTMLTableRowElement){
            elm.focus();
        }
    }
});

$('#btn-new-book').click(()=>{
    const frmBookDetail = new bootstrap.Modal(document.getElementById('frm-book-detail'));

    $('#txt-isbn, #txt-title, #txt-author, #txt-copies').val('').attr('disabled',false);

    $('#frm-book-detail').removeClass('edit').addClass('new').on('shown.bs.modal',()=>{
        $('#txt-isbn').focus();
    });

    frmBookDetail.show();
});

$('#btn-save').click(async()=>{

    const isbn = $('#txt-isbn').val();
    const title = $('#txt-title').val();
    const author = $('#txt-author').val();
    const copies = $('#txt-copies').val();

    let validated = true;

    $('#txt-isbn, #txt-title, #txt-author, #txt-copies').removeClass('is-invalid');

    if(!/^\d{13}$/.test(isbn)){
        $("#txt-isbn").addClass("is-invalid").select().focus();
        validated = false;
    }
    if(!/^[A-Za-z .,]+$/.test(title)){
        $("#txt-title").addClass("is-invalid").select().focus();
        validated = false;
    }
    if(!/^[A-Za-z .,]+$/.test(author)){
        $("#txt-author").addClass("is-invalid").select().focus();
        validated = false;
    }
    if(!/^\d+$/.test(copies)){
        $("#txt-copies").addClass("is-invalid").select().focus();
        validated = false;
    }

    if(!validated) return;

    try {
        $("#overlay").removeClass("d-none");
        const {isbn} = await saveBook();
        $("#overlay").addClass("d-none");
        showToast(`Book has been saved save successfully with the ISBN:${isbn}`,"success");
        $('#txt-isbn, #txt-title, #txt-author, #txt-copies').val("");
        $('#txt-isbn').focus();
    } catch (error) {
        $("#overlay").addClass("d-none");
        showToast("Failed to save the book","error");
        $('#txt-isbn').focus();
    }
});

async function saveBook(){

    const response = await fetch(`${API_END_POINT}/books`,{

        method: 'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            isbn: $("#txt-isbn").val(),
            title: $("#txt-title").val(),
            author: $("#txt-author").val(),
            copies: $("#txt-copies").val()
        })
    });

    if(response.status === 201){
        const book = await response.json();
        return book;
    }else{  
        throw new Error(response.status);
    }
}

function showToast(msg, msgType = 'warning'){
    $("#toast").removeClass('text-bg-warning').
                removeClass('text-bg-primary').
                removeClass('text-bg-success').
                removeClass('text-bg-error');

    if(msgType === 'success'){
        $("#toast").addClass('text-bg-success');
    }else if(msgType === 'error'){
        $("#toast").addClass('text-bg-error');
    }else if(msgType === 'info'){
        $("#toast").addClass('text-bg-primary');
    }else{
        $("#toast").addClass('text-bg-warning');
    }

    $("#toast .toast-body").text(msg);
    $("#toast").toast("show");
}

const myModalEl = document.getElementById('frm-book-detail')
myModalEl.addEventListener('hidden.bs.modal', () => {
    getBooks();
})

$('#tbl-books tbody').click(({target})=>{
    if (!target) return;

    let rowElm = target.closest('tr');
    getBookDetails($(rowElm.cells[0]).text());
});

async function getBookDetails(bookISBN){
    try {
        const response = await fetch(`${API_END_POINT}/books/${bookISBN}`);
        if(response.ok){
            const book = await response.json();

            const frmBookDetail = new bootstrap.Modal(document.getElementById('frm-book-detail'));
            $('#frm-book-detail').removeClass('new').removeClass('edit');

            $('#txt-isbn').attr('disabled','true').val(book.isbn);
            $('#txt-title').attr('disabled','true').val(book.title);
            $('#txt-author').attr('disabled','true').val(book.author);
            $('#txt-copies').attr('disabled','true').val(book.copies);
            
            frmBookDetail.show();

        }else{
            throw new Error(response.status);
        }
    } catch (error) {
        showToast('Failed to fetch the book details','Error');
    }
}

$('#btn-edit').click(()=>{
    $('#frm-book-detail').addClass('edit');
    $('#txt-isbn, #txt-title, #txt-author, #txt-copies').attr('disabled',false);
});

$('#btn-update').click(async ()=>{
    $("#overlay").removeClass("d-none");
    const isbn = $('#txt-isbn').val();
    const title = $('#txt-title').val();
    const author = $('#txt-author').val();
    const copies = $('#txt-copies').val();

    let validated = true;

    $('#txt-isbn, #txt-title, #txt-author, #txt-copies').removeClass('is-invalid');

    if(!/^\d{13}$/.test(isbn)){
        $("#txt-isbn").addClass("is-invalid").select().focus();
        validated = false;
    }
    if(!/^[A-Za-z .,]+$/.test(title)){
        $("#txt-title").addClass("is-invalid").select().focus();
        validated = false;
    }
    if(!/^[A-Za-z .,]+$/.test(author)){
        $("#txt-author").addClass("is-invalid").select().focus();
        validated = false;
    }
    if(!/^\d+$/.test(copies)){
        $("#txt-copies").addClass("is-invalid").select().focus();
        validated = false;
    }

    if(!validated) return;

    try{
        const response = await fetch(`${API_END_POINT}/books/${$('#txt-isbn').val()}`,
            {
                method: 'PATCH',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                    isbn, title, author, copies
                })
            });

        if(response.status === 204){
            showToast('Book has been update successfully','success')
        }else{
            throw new Error(response.status);
        }
    }catch(error){
        showToast("Failed to update book, Try Again!",'error');
    }finally{
        $("#overlay").addClass("d-none");
    }
});