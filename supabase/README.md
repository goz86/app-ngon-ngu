# Supabase Setup

## 1. Tạo project

Tạo một project Supabase mới, sau đó mở `SQL Editor` và chạy:

- `supabase/schema.sql`

Schema hiện tại sẽ tạo các bảng:

- `profiles`: hồ sơ người dùng
- `user_word_progress`: tiến độ từng từ
- `study_events`: lịch sử học chi tiết để làm biểu đồ ngày/tuần
- `user_sets`: bộ từ cá nhân, trạng thái chia sẻ và dữ liệu đồng bộ đa thiết bị

## 2. Bật đăng nhập thật

Vào:

- `Authentication`
- `Providers`

Bật ít nhất:

- `Email`

Tùy chọn:

- `Google`

Nếu dùng Google OAuth, hãy thêm đúng `Site URL` và `Redirect URL` của app trong Supabase.

## 3. Cài biến môi trường

Copy:

- `.env.example`

thành:

- `.env`

Rồi điền:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 4. Chạy lại app

Sau khi thêm `.env`, khởi động lại dev server.

Khi cấu hình đúng, app sẽ có:

- đăng nhập email / Google
- lưu hồ sơ học tập
- đồng bộ bộ từ cá nhân
- lịch sử học cho dashboard
- chia sẻ bộ từ bằng link
