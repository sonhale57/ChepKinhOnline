# Chép Kinh — Kế hoạch tổng thể

> File này là bản kế hoạch nguồn (source of truth) cho dự án, đủ chi tiết để một AI/dev khác
> đọc và code theo. Mỗi lần brainstorm module/tính năng mới, cập nhật trực tiếp vào file này
> và ghi lại vào "Nhật ký thay đổi" ở cuối.
>
> Quy ước: mục nào ghi "(đề xuất)" là gợi ý trong buổi brainstorm, người dùng chưa xác nhận rõ.
> Các điểm còn bỏ ngỏ được đánh số trong mục "Câu hỏi mở cần chốt" ở cuối file.
> Tên dự án "Chép Kinh" (slug `chep-kinh`) là tên tạm để đặt tên file.

## Tổng quan dự án

- **Mục tiêu**: ứng dụng giúp người dùng chép kinh và theo dõi tiến độ. Đối tượng chính là người dùng iPad/tablet (chép tay bằng Apple Pencil/stylus theo sổ tay khổ A4 đa trang, lưu giữ trọn vẹn nét chữ thật của người dùng dạng Digital Ink vector, hỗ trợ chữ mẫu in mờ để chép theo). Để phục vụ cả người dùng điện thoại và laptop (không chép tay được), ứng dụng có thêm chế độ gõ chép. Tính năng chép chung theo nhóm được hoãn sang kế hoạch sau.
- **Bối cảnh**: build mới hoàn toàn, chưa có hệ thống cũ nào được nhắc đến để kế thừa.
- **Nền tảng kỹ thuật (đã chốt)**: web/PWA, một codebase chạy trên iPad/tablet, điện thoại và laptop.
- **Phạm vi hiện tại (đã chốt, cập nhật 2026-09-24)**: lõi chép tay dạng Sổ tay A4 đa trang trên iPad/tablet (lưu giữ 100% nét chữ thật, căn chỉnh size chữ/dòng kẻ, chữ mẫu in mờ, không lệch tọa độ ngòi bút) + gõ chép cho laptop/phone. Cộng đồng chép chung tạm hoãn sang kế hoạch sau.
- **Ngoài phạm vi hiện tại**: cộng đồng chép chung (hoãn, nội dung đã bàn được giữ ở Module 6), ứng dụng đồng hành (đọc kinh, nghe tụng, tra chú giải, đếm niệm), cầu nối giấy thật (in mẫu, chụp lại bằng điện thoại), in quyển kinh tự chép thành sách. Người dùng chưa chọn các hướng này.
- **Danh sách module lớn**:
  1. Tài khoản và người dùng
  2. Thư viện kinh
  3. Chép tay
  4. Gõ chép
  5. Tiến độ và lượt chép
  6. Cộng đồng chép chung (tạm hoãn)
  7. Đồng bộ và offline (PWA)
  8. Tiện ích mở rộng
- **Vai trò trong hệ thống**:
  - Khách: chưa đăng nhập.
  - Người dùng: tài khoản loại "Người dùng", đăng nhập bằng tài khoản Google, chép kinh cá nhân, dùng giao diện người dùng. (Đã chốt 2026-09-21.)
  - Trưởng nhóm (tạm hoãn): người dùng đã tạo một nhóm chép chung (vai trò chỉ có trong nhóm đó).
  - Thành viên nhóm (tạm hoãn): người dùng đã tham gia một nhóm.
  - Quản trị viên (Admin): tài khoản loại "Admin", riêng biệt với tài khoản Người dùng; quản lý người dùng, quản trị kinh, xem báo cáo; dùng giao diện dashboard admin, thao tác chủ yếu trên laptop. (Đã chốt 2 loại tài khoản và 2 giao diện 2026-09-21; phương thức đăng nhập của Admin chưa chốt, xem Câu hỏi mở #16.)

## Quy tắc toàn cục theo thực thể

### Thực thể: Người dùng
- Mỗi người dùng có một tiến độ riêng cho mỗi bộ kinh trong mỗi lượt chép.
- (Tạm hoãn cùng Module 6) Mỗi người dùng chỉ được vào 1 nhóm cho mỗi bộ kinh. Không thể ở 2 nhóm cùng chép một bộ kinh. (Đã chốt trước khi hoãn; xem Câu hỏi mở #5.)
- (Tạm hoãn) Mỗi người dùng có thể ở nhiều nhóm nếu các nhóm chép các bộ kinh khác nhau.
- (Tạm hoãn) Khi người dùng đã ở một nhóm chép bộ kinh X thì không thể vào nhóm khác chép bộ kinh X; hệ thống chặn và thông báo cần rời nhóm cũ trước (cách xử lý là đề xuất).

### Thực thể: Bộ kinh
- Chỉ quản trị viên được nạp và sửa nội dung bộ kinh. Người dùng không được tự nhập kinh. (Đã chốt.)
- Text của kinh (do quản trị viên nhập) là mẫu để so sánh với chữ người dùng viết tay hoặc gõ vào, nên phải chính xác từng chữ, dấu và thứ tự. Nội dung dùng chung cho mọi người dùng.
- Mỗi bộ kinh thuộc một hoặc nhiều loại chữ: Quốc ngữ, chữ Hán, phiên âm Phạn/Pali. (Đã chốt.)
- Cấu trúc nội dung: Bộ kinh gồm nhiều Trang chép, mỗi trang gồm nhiều Dòng, mỗi dòng gồm nhiều Chữ. Quản trị viên nạp nội dung theo đoạn/câu, hệ thống dàn thành trang và dòng (cách dàn trang chi tiết đang brainstorm).
- Mỗi bộ kinh có một tổng số chữ cố định, dùng làm mẫu số để tính tiến độ.
- Định nghĩa "1 chữ" (đề xuất, xem Câu hỏi mở #10): Quốc ngữ và phiên âm Phạn/Pali tính theo âm tiết; chữ Hán tính theo từng ký tự; dấu câu không tính.

### Thực thể: Lượt chép
- Một lượt chép là một lần chép trọn vẹn một bộ kinh của một người dùng. (Đã chốt.)
- Một người dùng có thể chép lại một bộ kinh nhiều lượt nối tiếp: lượt mới chỉ được bắt đầu khi lượt trước đã đạt 100%, và lịch sử các lượt được giữ lại. (Đã chốt.)
- Một người dùng chỉ có tối đa một lượt đang chép cho mỗi bộ kinh tại một thời điểm.
- Tiến độ của lượt = số chữ đã chép đúng / tổng số chữ của bộ kinh. Chữ đúng là chữ khớp với text kinh và đúng thứ tự (được tô xanh), dù chép tay hay gõ. (Đã chốt tính theo số chữ; việc chỉ tính chữ đúng suy ra từ cơ chế xanh/đỏ ngày 2026-09-21, chờ xác nhận.)

### Thực thể: Nhóm chép chung (tạm hoãn — kế hoạch sau)
- Bất kỳ người dùng nào cũng được tạo nhóm; người tạo là trưởng nhóm. (Đã chốt.)
- Mỗi nhóm gắn với đúng một bộ kinh và một lượt chép. (Đã chốt.)
- Nhóm không chia kinh thành các phần: mỗi thành viên tự chép toàn bộ bộ kinh của nhóm. (Đã chốt.)
- Tiến độ nhóm = trung bình cộng tiến độ của từng thành viên trong lượt của nhóm. (Đã chốt.)
- Nhóm kết thúc khi cả nhóm chép xong. (Đã chốt; định nghĩa "xong cả nhóm" xem Câu hỏi mở #3.)
- Chế độ tham gia do trưởng nhóm chọn: riêng tư (chỉ vào bằng mã mời hoặc liên kết), công khai, hoặc công khai cần duyệt. (Đã chốt.)

## Module 1: Tài khoản và người dùng

Quản lý danh tính người dùng và phân quyền. Có 2 loại tài khoản riêng biệt — **Admin** và **Người dùng** — với 2 giao diện riêng: giao diện dashboard cho Admin và giao diện người dùng cho Người dùng. (Đã chốt 2026-09-21.) Các module khác (chép tay, gõ chép) đều cần tài khoản Người dùng vì tiến độ phải đồng bộ.

### Module con 1.1: Tài khoản Người dùng

#### Tính năng 1.1.1: Đăng nhập bằng Google, đăng xuất
- **Mô tả**: người dùng đăng nhập bằng tài khoản Google (Google Sign-In / OAuth); không có đăng ký email/mật khẩu riêng. (Đã chốt 2026-09-21.)
- **Vai trò liên quan**: Khách, Người dùng.
- **Luồng nghiệp vụ chính**: Khách bấm đăng nhập → chọn tài khoản Google → lần đầu đăng nhập thì hệ thống tự tạo tài khoản Người dùng gắn với email Google đó → vào giao diện người dùng.
- **Ràng buộc dữ liệu**: một tài khoản Google gắn với đúng một tài khoản Người dùng; email từ Google dùng làm định danh.
- **Trường hợp ngoại lệ**: người dùng đổi email Google, hoặc mất quyền truy cập email Google — chưa chốt.
- **Liên kết module khác**: mọi module cần biết người dùng hiện tại; đồng bộ (Module 7) dựa trên tài khoản.
- **Trạng thái**: Đã chốt phương thức đăng nhập (Google); chi tiết ngoại lệ Đang brainstorm.

### Module con 1.2: Hồ sơ người dùng

#### Tính năng 1.2.1: Hồ sơ cơ bản
- **Mô tả**: thông tin tối thiểu để nhận diện người dùng, lấy từ tài khoản Google (đề xuất: tên hiển thị và ảnh đại diện lấy từ Google).
- **Vai trò liên quan**: Người dùng.
- **Luồng nghiệp vụ chính**: người dùng xem hồ sơ của mình.
- **Ràng buộc dữ liệu**: chưa chốt.
- **Liên kết module khác**: Module 6 (tạm hoãn — hiển thị thành viên trong nhóm).
- **Trạng thái**: Đang brainstorm.

### Module con 1.3: Tài khoản Admin

#### Tính năng 1.3.1: Đăng nhập Admin
- **Mô tả**: tài khoản Admin tách biệt hoàn toàn với tài khoản Người dùng, không dùng chung cơ chế đăng nhập Google của người dùng thường (đề xuất, để tránh người dùng thường tự nhận là admin). Phương thức đăng nhập cụ thể (email/mật khẩu riêng, hay danh sách email Google được cấp quyền admin) chưa chốt.
- **Vai trò liên quan**: Quản trị viên (Admin).
- **Ràng buộc dữ liệu**: mỗi tài khoản Admin có thể có mức quyền khác nhau hay tất cả Admin đều toàn quyền — chưa chốt.
- **Liên kết module khác**: Module 2 (quản trị kinh), Module 1.4 (quản lý người dùng), Module 1.5 (báo cáo).
- **Trạng thái**: Đang brainstorm (xem Câu hỏi mở #16).

#### Tính năng 1.3.2: Giao diện dashboard Admin
- **Mô tả**: giao diện riêng cho Admin, tách biệt với giao diện người dùng, gồm các khu vực: quản lý người dùng, quản trị kinh, báo cáo. (Đã chốt có giao diện riêng 2026-09-21; bố cục cụ thể Đang brainstorm.)
- **Vai trò liên quan**: Quản trị viên (Admin).
- **Liên kết module khác**: dùng chung dữ liệu với Module 2.1 (quản trị kinh, hiện đã mô tả là "trên laptop" — nay chính là dashboard Admin).
- **Trạng thái**: Đã chốt hướng; bố cục Đang brainstorm.

### Module con 1.4: Quản lý người dùng (Admin)

#### Tính năng 1.4.1: Xem và quản lý danh sách người dùng
- **Mô tả**: Admin xem danh sách tài khoản Người dùng, tra cứu, và thao tác quản lý (đề xuất: khóa/mở tài khoản; các thao tác khác chưa chốt).
- **Vai trò liên quan**: Quản trị viên (Admin).
- **Ràng buộc dữ liệu**: chưa chốt (có được sửa/xóa dữ liệu chép của người dùng không, có được xem nội dung đã chép của người dùng không).
- **Liên kết module khác**: Module 5 (tiến độ và lượt chép của người dùng).
- **Trạng thái**: Đang brainstorm.

### Module con 1.5: Báo cáo (Admin)

#### Tính năng 1.5.1: Báo cáo tổng quan
- **Mô tả**: Admin xem báo cáo về hoạt động chép kinh (đề xuất: số người dùng, số lượt chép, tiến độ theo bộ kinh; số liệu cụ thể chưa chốt).
- **Vai trò liên quan**: Quản trị viên (Admin).
- **Liên kết module khác**: Module 5 (nguồn dữ liệu tiến độ), Module 2 (theo bộ kinh).
- **Trạng thái**: Đang brainstorm (xem Câu hỏi mở #17).

## Module 2: Thư viện kinh

Nơi chứa nội dung kinh. Toàn bộ nội dung do quản trị viên nạp sẵn; người dùng chỉ chọn để chép.

### Module con 2.1: Quản trị kinh

#### Tính năng 2.1.1: Nạp và quản lý bộ kinh (trong dashboard Admin)
- **Mô tả**: Quản trị viên nạp bộ kinh mới qua 2 phương thức linh hoạt:
  1. **Phương thức 1 - Tải lên tệp PDF (Tự động bóc tách từng trang)**: Admin tải lên file PDF của bài kinh. Hệ thống tự động nhận diện, trích xuất text từng trang theo chuẩn khổ A4, tính tổng số chữ, và cho phép Admin xem trước (Live Preview)/chỉnh sửa nội dung từng trang trước khi xuất bản.
  2. **Phương thức 2 - Nhập text trực tiếp (Manual / Text Editor)**: Admin nhập toàn văn hoặc từng đoạn văn, hệ thống tự động dàn trang A4 dựa trên cỡ chữ và số dòng mặc định.
- **Vai trò liên quan**: Quản trị viên (thao tác nạp, sửa, xuất bản), Người dùng (chỉ đọc kết quả ở thư viện).
- **Luồng nghiệp vụ chính**:
  - *Luồng PDF*: Admin tải file `.pdf` → Hệ thống phân tích từng trang, trích xuất text và đếm số từ → Hiển thị danh sách các trang A4 → Admin kiểm tra/sửa lỗi chính tả → Bấm xuất bản.
  - *Luồng Text*: Admin nhập tên, loại chữ, dán nội dung văn bản → Hệ thống tự động phân chia đoạn thành các trang A4 → Admin xem trước & xuất bản.
- **Ràng buộc dữ liệu**:
  - Chỉ quản trị viên được nạp, sửa, xuất bản hoặc ẩn bộ kinh.
  - Mỗi bộ kinh phải khai báo loại chữ: Quốc ngữ, chữ Hán, hoặc phiên âm Phạn/Pali.
  - Tổng số chữ được tính tự động theo định nghĩa "1 chữ" của từng ngôn ngữ.
  - Hỗ trợ lưu trữ cấu hình trang mặc định: cỡ chữ (20–40px), số dòng (6–12 dòng), kiểu lưới (Ô Ly, Ô Chữ Hán, Kẻ Ngang, Giấy Trơn).
- **Trường hợp ngoại lệ**: File PDF scan ảnh không có text layer (cần thông báo hoặc sử dụng OCR); sửa nội dung kinh khi đã có người đang chép (xem Câu hỏi mở #7).
- **Liên kết module khác**: Module 3 và 4 (nội dung hiển thị khi chép), Module 5 (tổng số chữ là mẫu số tiến độ).
- **Trạng thái**: Đã chốt chi tiết (2026-09-25).

### Module con 2.2: Thư viện cho người dùng

#### Tính năng 2.2.1: Duyệt và chọn bộ kinh
- **Mô tả**: người dùng xem danh sách bộ kinh đã xuất bản và chọn bộ kinh để bắt đầu một lượt chép hoặc để tạo/tham gia nhóm.
- **Vai trò liên quan**: Người dùng.
- **Luồng nghiệp vụ chính**: xem danh sách → chọn bộ kinh → bắt đầu lượt chép hoặc tạo nhóm cho bộ kinh đó.
- **Ràng buộc dữ liệu**: chỉ bộ kinh đã xuất bản mới hiện cho người dùng.
- **Liên kết module khác**: Module 5 (bắt đầu lượt), Module 6 (tạo nhóm).
- **Trạng thái**: Đang brainstorm (tìm kiếm, phân loại chưa bàn).

## Module 3: Chép tay

Trải nghiệm chính dành cho iPad/tablet: chép tay lên màn hình bằng Apple Pencil, stylus hoặc ngón tay theo mô hình **Sổ tay kỹ thuật số khổ A4 đa trang (Digital Ink Notebook)**. Hệ thống **lưu giữ trọn vẹn 100% nét chữ thật của người dùng**, không tự động chuyển đổi nét vẽ thành font chữ máy tính. Khổ giấy A4 sạch không in chữ mờ đè lên giấy, có bảng nhắc chữ 5 dòng phía trên và thanh công cụ fixed kế bên trang giấy. (Đã cập nhật theo yêu cầu 2026-09-25.)

### Module con 3.1: Canvas sổ tay A4 và nét viết thật
#### Tính năng 3.1.1: Trải nghiệm sổ tay A4 đa trang & Nét viết thật
- **Mô tả**: 
  - Khung chép được thiết kế theo **chuẩn tỷ lệ khổ giấy A4 (1 : 1.414)**, tự động căn chỉnh vừa vặn với màn hình iPad ở cả 2 chiều dọc (Portrait) và ngang (Landscape).
  - Bộ kinh được chia thành nhiều trang (Trang 1, 2, ... N), người dùng lật/chuyển trang như một quyển sách/sổ tay thực thụ.
  - Vùng Canvas thu nhận nét bút qua Pointer Events (`pointerdown`, `pointermove`, `pointerup`), lưu trữ dưới dạng chuỗi vector (tọa độ $x, y$, lực nhấn $pressure$, thời gian $t$, màu mực, loại bút: bút lông, bút mực, bút chì).
  - Người dùng có thể chọn nền giấy: giấy dó, giấy vàng cổ, giấy trắng; kèm các kiểu lưới ô: ô ly chữ Quốc ngữ, ô vuông chữ Hán (điền tự cách), dòng kẻ ngang hoặc giấy trơn.
- **Vai trò liên quan**: Người dùng.
- **Ràng buộc dữ liệu**: Nét viết thuộc về một trang cụ thể của một lượt chép; nét được lưu dạng vector để bảo toàn 100% nét chữ thật, hỗ trợ phóng to/thu nhỏ không vỡ hình và xuất file PDF khổ A4 chất lượng cao.

#### Tính năng 3.1.2: Khử lệch tọa độ ngòi bút (Zero Parallax) & Chống tì tay (Palm Rejection)
- **Mô tả**: 
  - Đảm bảo điểm chạm của ngòi bút Apple Pencil / con trỏ chuột trên iPad trùng khớp 100% với điểm xuất hiện của nét mực trên màn hình, không bị lệch (offset/parallax).
  - Tự động chuẩn hóa tọa độ Canvas theo tỉ lệ màn hình Retina kết hợp với `getBoundingClientRect()`.
  - Hỗ trợ cơ chế Palm Rejection: Khi sử dụng Apple Pencil (`e.pointerType === 'pen'`), hệ thống tự động loại trừ các chạm do lòng bàn tay tì lên màn hình (`e.pointerType === 'touch'`).

### Module con 3.2: Bảng nhắc chữ phía trên (Text Cue Bar / Prompt Card) & Kiểm tra tiến độ
#### Tính năng 3.2.1: Bảng nhắc 5 dòng text & Đánh dấu khớp đoạn độc lập
- **Mô tả**: 
  - Phía trên trang giấy A4 hiển thị **Bảng nhắc chữ (Text Prompt Card)** xuyên suốt toàn văn bộ kinh.
  - Mỗi lượt nhắc hiển thị đúng **5 dòng text** từ nội dung kinh mẫu.
  - Có các nút điều hướng mũi tên **[◀ Đoạn Trước]** và **[Đoạn Tiếp ▶]** để chuyển qua lại giữa các khối 5 dòng liên tục.
  - Nút **[Đánh Dấu Khớp]** tách riêng độc lập, cho phép người dùng chủ động xác nhận đã viết xong và khớp đoạn 5 dòng này.
  - Góc phải tích hợp điều hướng trang sổ tay A4 độc lập: **[◀ Trang Trước] [Trang Sau ▶] [+ Thêm Trang]** (do cỡ chữ viết tay của mỗi người lớn/nhỏ khác nhau, số trang sổ tay tách rời với số đoạn nhắc chữ).
  - Cung cấp chỉ số tiến độ đoạn (ví dụ: `Đoạn 1 / 10 • Dòng 1 → 5`).

### Module con 3.3: Thanh công cụ Fixed bên cạnh trang giấy & Lưu tiến trình theo % đã khớp cho từng tài khoản
#### Tính năng 3.3.1: Thanh công cụ Fixed cạnh trang giấy (Touch Dock Sidebar)
- **Mô tả**:
  - Toàn bộ công cụ thao tác nhanh được **fixed và kéo dài 100% bằng chiều cao khổ giấy A4** (Sidebar dọc nằm liền kề bên cạnh trang giấy trong cùng flex row), tối ưu vị trí đặt ngón tay cầm bút trên Tablet/iPad:
    - 🖌️ Chọn loại bút: Bút Lông Thư Pháp (Calligraphy), Bút Mực Chuẩn (Pen), Bút Chì (Pencil).
    - 🎨 Bảng màu mực: Mực đen tuyền (#1A1817), Chu sa đỏ (#8B0000), Xanh chàm (#1C3F60), Vàng kim (#B8860B)...
    - 📏 Chỉnh độ dày nét bút nhanh (XS: 3px, S: 6px, M: 10px, L: 16px).
    - ↩️ Hoàn tác (Undo) & ↪️ Làm lại (Redo).
    - 🗑️ Xóa toàn bộ nét trang (Clear Page).
    - 🖐️ Bật/Tắt Chế độ chống tì tay (Pen-Only Mode: chỉ nhận Apple Pencil/Stylus, bỏ qua chạm tay).
    - 📜 Tùy chọn nền giấy (Giấy Dó, Vàng Cổ, Trắng Sạch) & kiểu lưới ô (Ô Ly Tiêu Chuẩn, Điền Tự Chữ Hán, Dòng Kẻ Ngang, Giấy Trơn).
    - 🔄 Nút đảo vị trí Thanh công cụ (Sang Trái hoặc Sang Phải) cho người thuận tay trái / tay phải.

#### Tính năng 3.3.2: Lưu nét & Tự động tính toán % tiến trình riêng biệt cho từng tài khoản
- **Mô tả**:
  - **Lưu tiến trình dựa trên % đã khớp**:
    - Tỷ lệ % tiến trình được tính trực tiếp từ số đoạn 5 dòng đã đánh dấu khớp: `progressPercent = (Số đoạn đã khớp / Tổng số đoạn kinh) * 100%`.
    - Số từ hoàn thành: `completedWords = Math.round((Số đoạn đã khớp / Tổng số đoạn kinh) * Tổng số chữ của kinh)`.
  - **Cô lập dữ liệu tiến trình cho từng tài khoản (Multi-User Data Isolation)**:
    - **Backend**: Mọi truy vấn và lưu trữ (`UserSutraAttempt`, `UserPageStroke`) được xác thực và gán chặt chẽ theo `UserId` từ JWT Token (`[Authorize]`, chống triệt để BOLA/IDOR).
    - **Offline-First IndexedDB**: Sử dụng namespace cô lập theo từng người dùng `progress_u{userId}_s{sutraId}_att{attemptId}` và `strokes_u{userId}_att{attemptId}_p{pageId}`, đảm bảo khi chuyển đổi tài khoản trên cùng thiết bị tablet không bị ghi đè hoặc xung đột dữ liệu.
  - **Cơ chế lưu 2 tầng**:
    1. **Tự động lưu tức thời (Auto-Save)**: Mỗi khi viết nét chữ mới hoặc đánh dấu khớp đoạn, hệ thống lập tức lưu vào IndexedDB và gửi request cập nhật tiến trình ngầm lên Backend qua `POST /api/progress/update-progress`.
    2. **Nút Lưu Thủ Công (💾)**: Cho phép người dùng chủ động đồng bộ dữ liệu nét vẽ và tiến trình khi kết nối lại mạng sau khi viết offline.

## Module 4: Gõ chép

Chế độ dành cho người dùng laptop/điện thoại không chép tay được: hiện nội dung kinh và người dùng gõ lại.

### Module con 4.1: Gõ chép

#### Tính năng 4.1.1: Gõ lại nội dung kinh
- **Mô tả**: hệ thống hiển thị từng câu/dòng của kinh, người dùng gõ lại; mỗi chữ gõ đúng được cộng vào tiến độ tự động. (Đã chốt phạm vi và cách đếm tự động theo chữ gõ đúng.)
- **Vai trò liên quan**: Người dùng.
- **Luồng nghiệp vụ chính**: mở lượt chép hiện tại → hệ thống hiện dòng cần gõ → người dùng gõ → hệ thống so khớp từng chữ → chữ đúng được tính vào tiến độ.
- **Ràng buộc dữ liệu**:
  - Chỉ chữ gõ đúng mới được cộng vào tiến độ.
  - Mỗi chữ của một lượt chỉ được tính một lần dù chép bằng cách nào (xem Câu hỏi mở #8).
  - Quy tắc so khớp (dấu, hoa/thường, xử lý gõ sai) chưa chốt (xem Câu hỏi mở #11).
  - Logic so sánh với text kinh dùng chung với chép tay (xem Tính năng 3.2.1) để hai chế độ cho cùng kết quả xanh/đỏ (đề xuất).
- **Trường hợp ngoại lệ**: gõ chữ Hán và phiên âm Phạn/Pali cần bộ gõ tương ứng trên thiết bị của người dùng; ứng dụng chỉ ghi chú hướng dẫn, không tự cài bộ gõ.
- **Liên kết module khác**: Module 5 (tiến độ), Module 2 (nội dung kinh và loại chữ).
- **Trạng thái**: Đã chốt phạm vi; chi tiết so khớp Đang brainstorm.

## Module 5: Tiến độ và lượt chép

Hệ thống tính toán, lưu trữ và theo dõi tiến độ chép kinh cá nhân của từng Phật tử/người dùng; quản lý vòng đời của các lượt chép nối tiếp, nhật ký tu tập và thống kê công đức. Dữ liệu được đồng bộ 2 tầng (Offline-First IndexedDB và Backend Database) với mức độ bảo mật và cách ly tuyệt đối theo từng tài khoản.

### Module con 5.1: Tiến độ và cơ chế ghi nhận (Progress Tracking Engine)

#### Tính năng 5.1.1: Tính tiến độ theo đoạn nhắc chữ & Số từ hoàn thành
- **Mô tả**:
  - Tiến độ chép của một lượt được tính toán chính xác dựa trên tỷ lệ đoạn nhắc chữ (5 dòng/đoạn) đã được người dùng đánh dấu khớp (hoặc gõ đúng trong chế độ gõ chép):
    $$\text{Tỷ lệ \% hoàn thành} = \left( \frac{\text{Số đoạn 5 dòng đã đánh dấu khớp}}{\text{Tổng số đoạn của bộ kinh}} \right) \times 100\%$$
  - Số chữ/từ hoàn thành ước tính:
    $$\text{Số từ hoàn thành} = \text{round}\left( \frac{\text{Số đoạn đã khớp}}{\text{Tổng số đoạn}} \times \text{Tổng số từ của bộ kinh} \right)$$
  - Hiển thị trực quan qua thanh tiến độ (Progress Bar), nhãn phần trăm (`%`) và số từ (`completedWords / totalWords`).
- **Vai trò liên quan**: Người dùng (theo dõi khi viết và trong hồ sơ cá nhân).
- **Luồng nghiệp vụ chính**:
  1. Người dùng mở sổ chép kinh (`/write/:sutraId`).
  2. Viết xong đoạn chữ trên bảng nhắc 5 dòng và bấm **[Đánh Dấu Khớp]**.
  3. Hệ thống ghi nhận index đoạn vào danh sách `completedChunks` của lượt chép hiện tại.
  4. Tự động tính lại `progressPercent` và `completedWords`, cập nhật tức thì lên thanh tiến độ giao diện.
  5. Đồng bộ ngầm trạng thái xuống IndexedDB và gửi request `POST /api/progress/update-progress` lên Backend.
- **Ràng buộc dữ liệu**:
  - `progressPercent` nhận giá trị từ $0\%$ đến $100\%$.
  - Danh sách đoạn đã khớp (`CompletedChunksJson`) lưu dưới dạng mảng số nguyên các chunk index đã hoàn thành `[0, 1, 2, ...]`.
  - Một đoạn chỉ được tính 1 lần, không bị cộng dồn trùng lặp khi bấm lại nút.
- **Liên kết module khác**: Module 2 (tổng số từ, cấu trúc đoạn kinh), Module 3 (chép tay Canvas), Module 4 (gõ chép).
- **Trạng thái**: Đã chốt chi tiết & đã triển khai.

#### Tính năng 5.1.2: Lưu vị trí đang viết dở (Last Bookmark State)
- **Mô tả**:
  - Hệ thống tự động ghi nhớ chính xác trạng thái và vị trí đang viết dở của người dùng gồm:
    - `CurrentPageNumber`: Số trang sổ tay A4 đang mở (Trang 1, 2... N).
    - `CurrentChunkIndex`: Index đoạn nhắc chữ 5 dòng đang xem.
    - `TotalNotebookPages`: Tổng số trang sổ tay mà người dùng đã tạo thêm.
  - Khi người dùng quay lại sổ chép kinh, hệ thống tự động lật đúng đến trang sổ tay và đoạn nhắc chữ trước đó mà không cần người dùng phải tìm kiếm lại.
- **Vai trò liên quan**: Người dùng.
- **Ràng buộc dữ liệu**: Trang hiện tại không được vượt quá tổng số trang sổ tay đã tạo.
- **Trạng thái**: Đã chốt chi tiết & đã triển khai.

#### Tính năng 5.1.3: Kích hoạt hoàn thành lượt chép (Completion Trigger & 100% Milestone)
- **Mô tả**:
  - Khi tất cả các đoạn của bộ kinh đã được đánh dấu hoàn thành (`progressPercent === 100`):
    - Trạng thái lượt chép chuyển từ `IN_PROGRESS` sang `COMPLETED`.
    - Ghi nhận thời điểm hoàn thành `CompletedAt = GETDATE()`.
    - Hiển thị thông báo chúc mừng công đức viên mãn kèm hiệu ứng trang trọng (nhạc chuông chánh niệm / lời hồi hướng chúc phúc).
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đã chốt.

---

### Module con 5.2: Quản lý lượt chép nối tiếp (Multi-Attempt Lifecycle)

#### Tính năng 5.2.1: Quản lý lượt chép hiện tại và tạo lượt chép tiếp theo
- **Mô tả**:
  - Mỗi Phật tử có thể phát nguyện chép lại một bộ kinh nhiều lần (Lượt 1, Lượt 2, Lượt 3...).
  - Mỗi lượt chép mới bắt đầu lại từ $0\%$ với một quyển sổ tay A4 mới tinh.
  - Một tài khoản tại một thời điểm chỉ có tối đa **01 lượt đang chép (`IN_PROGRESS`)** cho mỗi bộ kinh.
  - Chỉ khi lượt hiện tại đạt $100\%$ (`COMPLETED`), nút **[Bắt Đầu Lượt Mới]** (`AttemptNumber = N + 1`) mới xuất hiện trong trang chi tiết và thư viện.
- **Vai trò liên quan**: Người dùng.
- **Luồng nghiệp vụ chính**:
  1. Người dùng đã chép xong Lượt 1 (đạt 100%).
  2. Vào Thư viện hoặc Hồ sơ cá nhân, chọn bộ kinh đã xong $\to$ Bấm **[Chép Lượt Tiếp Theo]**.
  3. Backend tạo bản ghi `UserSutraAttempt` mới với `AttemptNumber = 2`, `ProgressPercent = 0`, `Status = 'IN_PROGRESS'`.
  4. Mở giao diện sổ tay A4 mới để tiếp tục hành trình tu tập.
- **Ràng buộc dữ liệu**:
  - Khóa logic `UNIQUE (UserId, SutraId, AttemptNumber)`.
  - Lịch sử các nét vẽ và tiến trình của Lượt cũ (Lượt 1, 2...) được lưu trữ vĩnh viễn, không bị ghi đè hay mất đi.
- **Trạng thái**: Đã chốt.

#### Tính năng 5.2.2: Lật xem lại sổ tay các lượt đã hoàn thành (Read-Only Archival View)
- **Mô tả**:
  - Người dùng có thể mở lại quyển sổ tay A4 của các lượt chép cũ đã hoàn thành để lật từng trang ngắm nhìn lại từng nét chữ thư pháp của chính mình.
  - Ở chế độ xem lại (Read-Only): Canvas bị khóa vẽ để tránh làm hỏng nét bút cũ, thanh công cụ chuyển thành chế độ thưởng lãm / lật trang.
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đã chốt.

---

### Module con 5.3: Hồ sơ Cá nhân & Thống kê Công đức (Merit KPI & User Profile)

#### Tính năng 5.3.1: Trung tâm Thống kê Công đức Cá nhân (Merit KPI Dashboard)
- **Mô tả**:
  - Trong trang Hồ sơ cá nhân (`/profile`), hiển thị 4 chỉ số KPI tổng kết công đức tu tập:
    1. 📜 **Bộ Kinh Đã Tham Gia**: Tổng số bộ kinh khác nhau mà người dùng đã từng mở sổ chép.
    2. 🌸 **Lượt Hoàn Thành Viên Mãn**: Số lượt chép đã đạt 100%.
    3. ✍️ **Tổng Số Chữ Đã Chép**: Tổng số từ kinh văn đã hoàn thành trên tất cả các bộ kinh.
    4. 📄 **Trang Sổ Tay A4 Đã Viết**: Tổng số trang A4 có lưu nét chữ thật của người dùng.
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đã chốt & đã triển khai.

#### Tính năng 5.3.2: Danh sách sổ kinh & Tiếp tục chép tức thì (Resume Writing)
- **Mô tả**:
  - Danh sách toàn bộ các bộ kinh đang chép dở hoặc đã hoàn thành của người dùng, sắp xếp theo thời gian chép gần nhất.
  - Mỗi thẻ hiển thị: Tên kinh, Lượt chép số mấy, Thanh tiến độ %, Số chữ đã chép, Ngày bắt đầu chép.
  - Nút **[Tiếp Tục Chép]** (đối với kinh đang chép dở) đưa người dùng vào thẳng trang sổ tay và đoạn 5 dòng đang viết dở.
  - Nút **[Xem Lại Sổ Kinh]** (đối với kinh đã hoàn thành) mở chế độ thưởng lãm.
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đã chốt & đã triển khai.

#### Tính năng 5.3.3: Nhật ký tu tập theo ngày (Daily Practice Log & Streak)
- **Mô tả**:
  - Ghi nhận lịch sử những ngày người dùng có vào chép kinh để tạo thói quen tu tập tinh tấn mỗi ngày (Daily Streak).
  - Biểu đồ nhiệt (Heatmap calendar) hoặc danh sách hoạt động gần đây (ví dụ: *"Hôm nay bạn đã chép 350 chữ Kinh Pháp Cú"*).
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đang brainstorm (kế hoạch giai đoạn tiếp theo).

#### Tính năng 5.3.4: Bằng Chứng Nhận Công Đức & Xuất Bản Sổ Tay PDF
- **Mô tả**:
  - Khi hoàn thành 1 lượt chép kinh (100%), người dùng có thể:
    1. **Tạo Chứng Nhận Công Đức**: Tự động sinh ảnh/chứng nhận trang trọng ghi rõ Pháp danh/Họ tên Phật tử, Tên bộ kinh, Lượt chép số mấy, Ngày hoàn thành viên mãn, kèm lời hồi hướng công đức.
    2. **Xuất file PDF Sổ Tay Khổ A4**: Ghép toàn bộ các trang Canvas nét chữ thật của người dùng thành một tệp PDF A4 sắc nét để lưu trữ hoặc đem in thành sách kinh kỷ niệm.
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đang brainstorm (kế hoạch giai đoạn tiếp theo).

---

### Module con 5.4: Kiến Trúc Kỹ Thuật & CSDL (SQL Server 2008 & Fullstack)

#### Thiết kế Schema Database (Tuân thủ SQL Server 2008)
```sql
-- 1. Bảng Quản lý Lượt chép của người dùng
CREATE TABLE UserSutraAttempts (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL,
    SutraId BIGINT NOT NULL,
    AttemptNumber INT NOT NULL DEFAULT 1,
    ProgressPercent INT NOT NULL DEFAULT 0,
    CompletedWords INT NOT NULL DEFAULT 0,
    TotalWords INT NOT NULL DEFAULT 0,
    CurrentPageNumber INT NOT NULL DEFAULT 1,
    TotalNotebookPages INT NOT NULL DEFAULT 1,
    CurrentChunkIndex INT NOT NULL DEFAULT 0,
    CompletedChunksJson NVARCHAR(MAX) NOT NULL DEFAULT N'[]',
    Status NVARCHAR(30) NOT NULL DEFAULT N'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'PAUSED'
    StartedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CompletedAt DATETIME NULL,
    CONSTRAINT FK_Attempts_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Attempts_Sutra FOREIGN KEY (SutraId) REFERENCES Sutras(Id) ON DELETE CASCADE
);

-- Index tối ưu truy vấn tiến độ theo người dùng
CREATE NONCLUSTERED INDEX IX_UserSutraAttempts_User_Sutra
ON UserSutraAttempts (UserId, SutraId, Status)
INCLUDE (ProgressPercent, CompletedWords, TotalWords, AttemptNumber);

-- 2. Bảng Lưu trữ Nét bút thật từng trang A4
CREATE TABLE UserPageStrokes (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    AttemptId BIGINT NOT NULL,
    UserId BIGINT NOT NULL,
    PageNumber INT NOT NULL,
    StrokesDataJson NVARCHAR(MAX) NOT NULL, -- Mảng vector nét bút [[x, y, p, t, color, width]...]
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_PageStrokes_Attempt FOREIGN KEY (AttemptId) REFERENCES UserSutraAttempts(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PageStrokes_User FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- Index truy vấn nét vẽ theo trang
CREATE NONCLUSTERED INDEX IX_UserPageStrokes_Attempt_Page
ON UserPageStrokes (AttemptId, PageNumber)
INCLUDE (UserId, UpdatedAt);
```

#### Quy Chuẩn API RESTful & Bảo Mật Dữ Liệu
- `GET /api/progress/attempt/{sutraId}`: Lấy thông tin lượt chép hiện tại của người dùng đăng nhập (`UserId` trích xuất từ JWT Claims).
- `POST /api/progress/update-progress`: Cập nhật tiến độ `ProgressPercent`, `CompletedWords`, `CurrentPageNumber`, `CurrentChunkIndex`, `CompletedChunksJson`.
- `POST /api/progress/save-strokes`: Lưu dữ liệu vector nét bút của trang A4.
- `GET /api/progress/get-strokes/{attemptId}/{pageNumber}`: Lấy dữ liệu nét vẽ trang A4 phục vụ hiển thị Canvas.
- `GET /api/user/my-attempts`: Lấy danh sách các bộ kinh và lịch sử lượt chép của người dùng phục vụ trang Hồ Sơ (`/profile`). Phân trang chuẩn SQL Server 2008 bằng `ROW_NUMBER() OVER()`.

## Module 6: Cộng đồng chép chung (TẠM HOÃN — kế hoạch sau)

Cho phép nhóm cùng chép một bộ kinh với tiến độ chung. Mỗi thành viên tự chép toàn bộ bộ kinh; nhóm chỉ tổng hợp tiến độ.

> Tạm hoãn theo quyết định ngày 2026-09-21. Nội dung đã bàn được giữ nguyên để dùng khi lên kế hoạch lại; toàn bộ tính năng trong Module 6 không nằm trong phạm vi hiện tại. Khi làm lại module này cần rà lại các điểm liên quan đến tiến độ (nay tính theo chữ nhận diện đúng) và quy tắc nhóm.

### Module con 6.1: Tạo và quản lý nhóm

#### Tính năng 6.1.1: Tạo nhóm
- **Mô tả**: bất kỳ người dùng nào cũng tạo được nhóm chép chung. (Đã chốt.)
- **Vai trò liên quan**: Người dùng (tạo), Trưởng nhóm (sau khi tạo).
- **Luồng nghiệp vụ chính**: người dùng chọn bộ kinh → đặt tên nhóm → chọn chế độ tham gia (riêng tư, công khai, công khai cần duyệt) → nhóm được tạo, người tạo là trưởng nhóm và tự động là thành viên đầu tiên.
- **Ràng buộc dữ liệu**:
  - Nhóm gắn với đúng một bộ kinh và một lượt chép.
  - Người tạo phải thỏa ràng buộc "1 nhóm cho mỗi bộ kinh" (không đang ở nhóm khác cùng bộ kinh).
  - Giới hạn số nhóm mỗi người được tạo và số thành viên mỗi nhóm chưa chốt (xem Câu hỏi mở #6).
- **Liên kết module khác**: Module 2 (bộ kinh), Module 5 (lượt chép).
- **Trạng thái**: Tạm hoãn (trước khi hoãn: Đã chốt phần cốt lõi; giới hạn Đang brainstorm)

#### Tính năng 6.1.2: Quyền của trưởng nhóm
- **Mô tả**: trưởng nhóm chọn chế độ tham gia và duyệt yêu cầu tham gia khi nhóm ở chế độ công khai cần duyệt. (Đã chốt.)
- **Ràng buộc dữ liệu**: các quyền khác (xóa thành viên, đổi chế độ tham gia, chuyển quyền trưởng nhóm, giải tán nhóm) chưa chốt (xem Câu hỏi mở #9).
- **Trạng thái**: Tạm hoãn (trước khi hoãn: Đang brainstorm)

### Module con 6.2: Tham gia nhóm

#### Tính năng 6.2.1: Tham gia theo chế độ của nhóm
- **Mô tả**: người dùng vào nhóm tùy chế độ do trưởng nhóm chọn. (Đã chốt.)
- **Vai trò liên quan**: Người dùng, Trưởng nhóm (duyệt).
- **Luồng nghiệp vụ chính**:
  - Riêng tư: người dùng vào bằng mã mời hoặc liên kết riêng → trở thành thành viên.
  - Công khai: nhóm hiện trong danh sách công khai → người dùng bấm tham gia → trở thành thành viên ngay.
  - Công khai cần duyệt: người dùng gửi yêu cầu → trưởng nhóm duyệt hoặc từ chối → nếu duyệt thì trở thành thành viên.
- **Ràng buộc dữ liệu**:
  - Mỗi người chỉ được vào 1 nhóm cho mỗi bộ kinh (xem Quy tắc toàn cục — Thực thể: Người dùng).
  - Nhóm riêng tư không hiện trong danh sách công khai.
- **Trường hợp ngoại lệ**: người đang chép dở bộ kinh đó vào nhóm giữa chừng (xem Câu hỏi mở #4); người rời nhóm (xem Câu hỏi mở #5).
- **Liên kết module khác**: Module 5 (tiến độ cá nhân của lượt).
- **Trạng thái**: Tạm hoãn (trước khi hoãn: Đã chốt phần cốt lõi; ngoại lệ Đang brainstorm)

### Module con 6.3: Tiến độ nhóm

#### Tính năng 6.3.1: Tiến độ nhóm và kết thúc nhóm
- **Mô tả**: tiến độ nhóm = trung bình cộng tiến độ của từng thành viên; nhóm kết thúc khi cả nhóm chép xong. (Đã chốt.)
- **Vai trò liên quan**: Thành viên nhóm, Trưởng nhóm.
- **Luồng nghiệp vụ chính**: mỗi thành viên chép toàn bộ bộ kinh → tiến độ cá nhân cập nhật → tiến độ nhóm được tính lại bằng trung bình → khi cả nhóm xong thì nhóm kết thúc.
- **Ràng buộc dữ liệu**:
  - Không chia phần kinh cho từng thành viên.
  - Thành viên mới vào hoặc chưa bắt đầu tính 0% trong trung bình (đề xuất).
  - Thành viên rời nhóm không còn được tính trong trung bình (đề xuất).
  - Tiến độ nhóm chỉ để động viên, không xếp hạng thi đua giữa các thành viên hoặc nhóm (đề xuất).
  - Định nghĩa "xong cả nhóm" chưa chốt (xem Câu hỏi mở #3).
- **Liên kết module khác**: Module 5 (tiến độ cá nhân của lượt gắn với nhóm).
- **Trạng thái**: Tạm hoãn (trước khi hoãn: Đã chốt công thức và nguyên tắc kết thúc; chi tiết Đang brainstorm)

### Module con 6.4: Hồi hướng

#### Tính năng 6.4.1: Hồi hướng tập thể
- **Mô tả**: đề xuất từ buổi brainstorm ban đầu: khi nhóm hoặc cá nhân hoàn thành, có phần hồi hướng. Người dùng chưa xác nhận cách làm.
- **Trạng thái**: Tạm hoãn (trước khi hoãn: Đang brainstorm)

## Module 7: Đồng bộ và offline (PWA)

Hệ quả của quyết định chọn web/PWA: cần đồng bộ giữa thiết bị và xử lý khi mất mạng.

### Module con 7.1: Đồng bộ và offline

#### Tính năng 7.1.1: Đồng bộ đa thiết bị
- **Mô tả**: tiến độ, lượt chép và nét chép đồng bộ giữa các thiết bị của cùng một tài khoản (ví dụ chép tay trên iPad, xem tiến độ trên điện thoại).
- **Vai trò liên quan**: Người dùng.
- **Ràng buộc dữ liệu**: dữ liệu thuộc tài khoản, không thuộc thiết bị.
- **Trạng thái**: Đang brainstorm.

#### Tính năng 7.1.2: Chép khi mất mạng
- **Mô tả**: nét chép được lưu cục bộ trên thiết bị và đồng bộ lên máy chủ khi có mạng lại; PWA cài được lên màn hình chính của iPad.
- **Trường hợp ngoại lệ**: hai thiết bị cùng sửa một trang khi chưa đồng bộ (xem Câu hỏi mở #12).
- **Lưu ý về nhận diện chữ**: tùy engine nhận diện được chọn (Câu hỏi mở #13), việc nhận diện có thể cần mạng; khi đó chép tay lúc offline chỉ lưu nét, chưa có màu xanh/đỏ cho tới khi có mạng (đề xuất).
- **Trạng thái**: Đang brainstorm.

## Module 8: Tiện ích mở rộng & Trải nghiệm Chánh Niệm (Zen Utilities)

Tập hợp các tiện ích bổ trợ cao cấp nhằm nâng cao trải nghiệm tu tập, giúp Phật tử tập trung tâm trí, nuôi dưỡng sự an tịnh và dễ dàng cài đặt ứng dụng trực tiếp lên iPad / Tablet như một ứng dụng nguyên bản (Native App).

---

### Module con 8.1: Lối tắt cài đặt ứng dụng nhanh lên iPad & Tablet (PWA 1-Tap Install)

#### Tính năng 8.1.1: Hướng dẫn cài đặt nhanh lên Màn hình chính iPad (Add to Home Screen)
- **Mô tả**:
  - Tích hợp nút tiện ích **[📲 Cài Đặt Cho iPad / Tablet]** trên thanh Header / Navbar và Trang chủ.
  - Khi người dùng nhấn nút trên iPad (trình duyệt Safari):
    - Hệ thống mở popup hướng dẫn trực quan 3 bước 1-chạm:
      1. **Bước 1**: Nhấn vào biểu tượng **Chia sẻ** ($\lceil\uparrow\rceil$ Share Icon) trên thanh công cụ Safari.
      2. **Bước 2**: Cuộn xuống và chọn **"Thêm vào MH chính"** (⊞ Add to Home Screen).
      3. **Bước 3**: Nhấn **"Thêm"** (Add) ở góc trên bên phải để hoàn tất.
  - Khi mở từ Màn hình chính iPad:
    - Ứng dụng chạy ở chế độ **Toàn màn hình độc lập (Standalone PWA)** không còn thanh địa chỉ URL Safari, không bị phân tâm bởi các tab trình duyệt.
    - Tự động khóa phóng to trang bừa bãi (`touch-action: manipulation`, `user-scalable=no`), tối ưu 100% diện tích màn hình cho khổ giấy A4 và ngòi bút Apple Pencil.
    - Hỗ trợ đầy đủ vùng an toàn `env(safe-area-inset-*)` cho tất cả các dòng iPad Pro, iPad Air, iPad Gen 9/10 và iPad Mini.
- **Tính năng trên Android Tablet & Windows Desktop**:
  - Tự động bắt sự kiện `beforeinstallprompt` để hiển thị nút **[Cài Đặt Ngay]** 1-click trực tiếp không cần mở menu chia sẻ.
- **Vai trò liên quan**: Người dùng, Khách.
- **Trạng thái**: Đã chốt chi tiết (2026-09-26).

---

### Module con 8.2: Không Gian Chánh Niệm & Âm Thanh An Tịnh (Mindful Zen Mode)

#### Tính năng 8.2.1: Bộ âm thanh thiền định nhẹ nhàng (Zen Ambient Audio)
- **Mô tả**:
  - Cung cấp thanh phát âm thanh tĩnh lặng nền tích hợp ngay góc thanh công cụ, có thể bật/tắt và điều chỉnh âm lượng:
    - 🔔 **Tiếng Chuông Bát Tây Tạng / Chuông Gia Trì**: Âm vang trầm ấm, ngân dài giúp thanh lọc tâm trí.
    - 🪵 **Tiếng Mõ Nhịp Đều**: Nhịp gõ mõ chậm rãi, đều đặn tạo sự an định khi viết từng nét chữ.
    - 🌧️ **Tiếng Mưa Rơi Êm Dịu**: Tiếng mưa rào nhẹ nhàng trên mái hiên chùa.
    - 🎋 **Tiếng Suối Róc Rách & Gió Núi**: Hòa quyện cùng thiên nhiên thanh tịnh.
- **Vai trò liên quan**: Người dùng.
- **Ràng buộc dữ liệu**: Lưu cấu hình âm thanh (Âm lượng, bài nhạc đang chọn, trạng thái Bật/Tắt) vào `localStorage` của thiết bị.
- **Trạng thái**: Đã chốt chi tiết.

#### Tính năng 8.2.2: Chuông chánh niệm ngắt quãng (Mindfulness Bell)
- **Mô tả**:
  - Định kỳ 15 phút, 30 phút hoặc mỗi khi người dùng **hoàn thành 1 trang A4 / 1 đoạn kinh**, hệ thống phát nhẹ một tiếng chuông ngân trầm để nhắc người dùng dừng lại 3 giây, hít thở sâu và thư giãn cổ tay.
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đã chốt.

#### Tính năng 8.2.3: Chế độ Toàn Màn Hình Tĩnh Lặng (Zen Focus Mode)
- **Mô tả**:
  - Cho phép ẩn toàn bộ thanh điều hướng, các nút bấm không cần thiết, chỉ giữ lại khổ giấy A4, bảng nhắc kinh và thanh công cụ viết.
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đã chốt.

---

### Module con 8.3: Nhắc Giờ Công Phu & Tu Tập Tinh Tấn (Daily Practice Bells)

#### Tính năng 8.3.1: Hẹn giờ nhắc chép kinh hàng ngày (Mindful Reminders)
- **Mô tả**:
  - Người dùng có thể cài đặt khung giờ nhắc nhở công phu hàng ngày (ví dụ: Khung giờ sáng 05:30, Khung giờ tối 20:00 theo múi giờ Việt Nam UTC+7).
  - Sử dụng Web Notification gửi thông điệp nhẹ nhàng: *"Đã đến giờ lắng tâm chép kinh. Chúc bạn một thời khắc tu tập an lạc."*
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đã chốt & đã triển khai (2026-09-26).

#### Tính năng 8.3.2: Thống kê chuỗi ngày tinh tấn (Daily Practice Streak)
- **Mô tả**:
  - Hiển thị số ngày chép kinh liên tục (ví dụ: 🔥 7 ngày tinh tấn liên tiếp) và biểu đồ lịch tu tập 14 ngày gần nhất trên trang Hồ sơ cá nhân nhằm khuyến khích duy trì thói quen tu tập mỗi ngày.
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đã chốt & đã triển khai (2026-09-26).

---

### Module con 8.4: Xuất Bản Sổ Tay A4 Dạng PDF Chất Lượng Cao (High-Res PDF Export)

#### Tính năng 8.4.1: Ghép và Xuất Sổ Tay A4 Đa Trang thành file PDF
- **Mô tả**:
  - Cho phép xuất toàn bộ các trang sổ tay A4 chứa 100% nét bút thật của người dùng thành một tệp PDF chuẩn kích thước A4 (210 x 297mm).
  - Tệp PDF gồm: Trang bìa kinh trang trọng (Tên kinh, Họ tên Phật tử, Lời hồi hướng công đức), các trang kinh chép tay kèm số trang và khung viền nhã nhặn.
  - Người dùng có thể lưu trữ vĩnh viễn trên máy, gửi tặng người thân hoặc đem ra nhà in đóng thành sách kinh kỷ niệm.
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đã chốt & đã triển khai (2026-09-26).

#### Tính năng 8.4.2: Tạo Thiệp Trích Dẫn Kinh Điển (Sutra Quote Cards)
- **Mô tả**:
  - Chọn một câu kinh hay trong bài kinh đã chép để tạo thiệp ảnh thư pháp vuông (1:1) hoặc dọc (9:16) chia sẻ lên mạng xã hội.
- **Vai trò liên quan**: Người dùng.
- **Trạng thái**: Đang brainstorm.

---

## Câu hỏi mở cần chốt

1. **Chép tự do và ước lượng nét** — **Đã chốt 2026-09-21**: không bắt buộc theo dòng, không có chép tự do; người dùng chép đủ chữ theo thứ tự của kinh, canvas nhận diện chữ viết tay và tô xanh/đỏ so với text kinh (xem 3.2.1).
2. **Đăng nhập**: dùng phương thức nào (email và mật khẩu, tài khoản Google, số điện thoại, hoặc nhiều cách)? (Xem thêm #15.)
3. **(Hoãn cùng Module 6) "Xong cả nhóm"**: nhóm kết thúc khi mọi thành viên đạt 100%, khi trưởng nhóm đóng nhóm, hay có thời hạn? Thành viên bỏ dở giữa chừng xử lý thế nào?
4. **(Hoãn cùng Module 6) Vào nhóm giữa chừng**: người đang chép dở bộ kinh có được vào nhóm không, và tiến độ sẵn có có được tính vào nhóm không?
5. **(Hoãn cùng Module 6) Rời nhóm**: khi rời nhóm, tiến độ cá nhân của lượt đó có giữ nguyên không? Sau khi nhóm kết thúc, người dùng có được vào nhóm khác cho lượt mới của cùng bộ kinh không (đề xuất: có)?
6. **Giới hạn số lượng**: ngưỡng ước lượng nét không còn áp dụng vì đã đổi sang nhận diện chữ (2026-09-21). Phần giới hạn số thành viên mỗi nhóm và số nhóm mỗi người được tạo được hoãn cùng Module 6.
7. **Sửa kinh sau khi đã có người chép**: khóa không cho sửa, hay tạo phiên bản mới và giữ tiến độ cũ theo phiên bản cũ? (Nay càng quan trọng vì text kinh là mẫu so sánh: sửa một chữ có thể làm đổi kết quả xanh/đỏ đã có.)
8. **Chép bằng cả hai cách**: mỗi chữ của một lượt chỉ tính một lần dù chép tay hay gõ chép (đề xuất). Người dùng xác nhận.
9. **(Hoãn cùng Module 6) Quyền trưởng nhóm và hiển thị tiến độ**: trưởng nhóm có được xóa thành viên, đổi chế độ tham gia, chuyển quyền, giải tán nhóm không? Thành viên có thấy tiến độ từng người khác không?
10. **Định nghĩa "1 chữ"**: xác nhận đề xuất: Tiếng Việt và phiên âm tính theo âm tiết, chữ Hán tính theo ký tự, dấu câu không tính.
11. **Quy tắc so khớp khi gõ chép** (dùng chung logic với chép tay): có bỏ qua dấu, hoa/thường không? Gõ sai một chữ thì chặn không cho đi tiếp hay cho sửa rồi tiếp tục?
12. **Xung đột đồng bộ**: khi hai thiết bị cùng sửa một trang chưa đồng bộ thì giữ bản nào (mới nhất, hay gộp nét)?
13. **Engine chép tay & Lưu giữ nét chữ thật** — **Đã chốt 2026-09-24**: Không tự động chuyển đổi nét vẽ thành text máy tính. Hệ thống lưu giữ 100% nét chữ thật dạng Digital Ink vector (tọa độ $x, y$, lực nhấn, màu mực), tổ chức theo Sổ tay A4 đa trang, cho phép người dùng tùy chỉnh size chữ/khoảng cách dòng kẻ và chuẩn hóa tọa độ Canvas không bị lệch ngòi bút trên iPad Retina.
14. **Hiển thị chữ mẫu & Theo dõi tiến độ chép tay** — **Đã chốt 2026-09-24**: Text kinh hiển thị làm lớp nền in mờ (Tracing layer) để chép theo. Nét viết thật của người dùng nằm ở lớp trên cùng. Lớp chữ mẫu bên dưới chuyển màu xanh dịu khi trang/dòng hoàn thành để ghi nhận tiến độ.
15. **Tài khoản và máy chủ khi hoãn cộng đồng** (mới, 2026-09-21): chép cá nhân có cần tài khoản không? Không tài khoản thì dữ liệu nằm trên thiết bị và mất đồng bộ giữa iPad, điện thoại, laptop; có tài khoản thì cần máy chủ (dùng cho đồng bộ, và có thể cho nhận diện nếu chọn dịch vụ đám mây).
16. **Đăng nhập Admin** (mới, 2026-09-21): tách biệt với đăng nhập Google của người dùng thường bằng cách nào — email/mật khẩu riêng, hay danh sách email Google được cấp quyền admin? Có nhiều mức quyền Admin hay chỉ một mức toàn quyền?
17. **Nội dung báo cáo Admin** (mới, 2026-09-21): báo cáo cần những số liệu gì (số người dùng, số lượt chép, tiến độ theo bộ kinh, hoạt động theo thời gian...), và có xuất báo cáo ra file không?
18. **Quyền của Admin với dữ liệu người dùng** (mới, 2026-09-21): Admin có được xem nội dung đã chép, sửa hoặc xóa tiến độ/lượt chép của người dùng không? Việc khóa/mở tài khoản người dùng hoạt động thế nào?

## Nhật ký thay đổi

| Ngày | Module/Tính năng | Nội dung thay đổi |
|---|---|---|
| 2026-09-21 | Toàn dự án | Khởi tạo kế hoạch. Chốt: phạm vi (chép tay + gõ chép + cộng đồng), nền tảng web/PWA, nội dung kinh chỉ do quản trị nạp, nhiều loại chữ, tiến độ theo số chữ, chép tay ước lượng tự động theo nét, chép lại nhiều lượt nối tiếp, ai cũng tạo được nhóm, 3 chế độ tham gia, mỗi thành viên chép toàn bộ kinh và tiến độ nhóm là trung bình, 1 người chỉ vào 1 nhóm cho mỗi bộ kinh, nhóm gắn với một lượt. |
| 2026-09-21 | 3.2.1 Chép tay | Đổi cách ghi nhận tiến độ chép tay từ "ước lượng số chữ theo nét viết trong khung dòng" sang "nhận diện chữ viết tay và so sánh với text kinh theo thứ tự, xanh/đỏ như Test Typing". Lý do: người dùng muốn kiểm tra đúng/sai từng chữ; không bắt buộc khung dòng, không có chép tự do. Câu hỏi mở #1 đã chốt, ngưỡng nét (#6) không còn áp dụng, thêm câu hỏi mở #13, #14. Tiến độ nay tính theo chữ đúng. |
| 2026-09-21 | Module 6 | Tạm hoãn Cộng đồng chép chung sang kế hoạch sau, giữ nguyên nội dung đã bàn. Các quy tắc nhóm ở Quy tắc toàn cục và câu hỏi mở #3, #4, #5, #9 được đánh dấu hoãn; thêm câu hỏi mở #15 về việc còn cần tài khoản và máy chủ không. |
| 2026-09-21 | Module 1 | Chia tài khoản thành 2 loại: Admin (quản lý người dùng, quản trị kinh, xem báo cáo) và Người dùng (đăng nhập bằng Google). Thêm 2 giao diện riêng: dashboard Admin và giao diện người dùng. Cập nhật vai trò hệ thống, Module con 1.1–1.5, liên kết với Tính năng 2.1.1 (nay thuộc dashboard Admin). Thêm câu hỏi mở #16, #17, #18. |
| 2026-09-24 | Module 3 & Toàn cục | Chốt định hướng cốt lõi: Sổ tay chép kinh khổ A4 đa trang, lưu giữ 100% nét chữ thật dạng Digital Ink vector (không biến thành font máy tính). Bổ sung tùy chỉnh size chữ/khoảng cách dòng kẻ cho vừa tay viết và khổ giấy A4. Chuẩn hóa toạ độ Canvas không bị lệch ngòi bút (Zero Parallax / Retina mapping) và chống tì tay (Palm Rejection) trên iPad. Chốt câu hỏi #13, #14. |
| 2026-09-25 | Module 2 Quản trị kinh | Bổ sung 2 phương thức nạp kinh cho Admin: (1) Tải file PDF tự động bóc tách và phân bổ text từng trang A4 kèm xem trước/chỉnh sửa, (2) Nhập text trực tiếp và tự động dàn trang. |
| 2026-09-26 | Module 5 Tiến độ & Lượt chép | Hoàn thiện bản kế hoạch chi tiết cho Module 5: Cơ chế tính tiến độ theo đoạn nhắc chữ & số từ, lưu vết trang sổ tay đang viết dở, quản lý vòng đời lượt chép nối tiếp (Lượt 1, 2... N), chế độ xem lại sổ kinh đã hoàn thành (Read-Only), Trung tâm KPI công đức trong Profile cá nhân và thiết kế CSDL SQL Server 2008 & API RESTful. |
| 2026-09-26 | Module 8 Tiện ích mở rộng | Lập kế hoạch chi tiết cho Module 8: Lối tắt 3 bước cài đặt PWA Standalone lên màn hình chính iPad (Add to Home Screen), Không gian âm thanh thiền định an tịnh (Chuông Bát, Mõ nhịp, Mưa êm), Chuông chánh niệm ngắt quãng, Nhắc giờ công phu tu tập và Xuất bản Sổ tay A4 dạng PDF độ phân giải cao 300 DPI. |
| 2026-09-26 | Triển khai Module 8 & Tối ưu | Triển khai hoàn tất: (1) Xuất bản Sổ tay A4 dạng PDF đa trang với nét chữ thật và bìa kinh trang trọng, (2) Widget Chuỗi ngày tinh tấn (Daily Streak) & cài đặt thông báo nhắc nhở tu tập hàng ngày theo giờ Việt Nam (UTC+7), (3) Thay thế toàn bộ hiển thị "Quốc Ngữ" thành "Tiếng Việt", (4) Bổ sung cử chỉ cảm ứng iPad (2 ngón chạm Undo, 3 ngón chạm Redo). |

