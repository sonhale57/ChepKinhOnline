---
name: fullstack-frontend
description: Hướng dẫn phát triển giao diện React TypeScript an toàn, phân quyền UI (Client Security), ưu tiên trải nghiệm Tablet/iPad cảm ứng, xử lý dữ liệu lớn (Virtual Scrolling / Server-side Pagination), và chuẩn hóa Design System đồng bộ.
---

# Skill Frontend: Giao Diện Trải Nghiệm Người Dùng, Tablet/iPad-First & Bảo Mật Client

Skill này hướng dẫn xây dựng giao diện **React TypeScript** chuẩn mực: **ưu tiên hàng đầu cho Tablet & iPad**, kiểm soát phân quyền UI, tối ưu hiển thị danh sách dữ liệu lớn, đồng bộ hóa Design System và đảm bảo đầy đủ thư viện không gây lỗi runtime.

---

## 1. Thiết Kế Ưu Tiên Cho Tablet & iPad (Tablet/iPad-First UX/UI)

> [!IMPORTANT]
> **Dự án phục vụ chủ yếu cho người dùng trên Tablet và iPad**. Mọi thành phần giao diện, layout, bảng biểu, form nhập liệu phải được thiết kế và kiểm thử tối ưu cho màn hình cảm ứng độ phân giải từ **768px (iPad Mini/Portrait) đến 1024px/1366px (iPad Pro/Landscape)**.

### 1.1 Chuẩn Vùng Chạm Cảm Ứng (Touch Target Ergonomics)
- **Kích thước tối thiểu**: Tất cả các phần tử tương tác (Button, Icon Action, Checkbox, Radio, Tab, Dropdown item) phải có kích thước tối thiểu **44x44px đến 48x48px** (`min-h-[44px] min-w-[44px]` hoặc `p-3`).
- **Khoảng cách chống bấm nhầm (Touch Spacing)**: Khoảng cách giữa các nút bấm liền kề tối thiểu 8px - 12px (`gap-3` hoặc `space-x-3`).
- **Phản hồi chạm (Touch Feedback)**: KHÔNG dựa vào trạng thái `:hover`. Thay vào đó, sử dụng `:active` và hiệu ứng chạm trực quan (`active:scale-95 transition-transform`, `active:bg-gray-100`).
- **Chống zoom ngoài ý muốn**: Sử dụng `touch-action: manipulation` trong CSS để tránh độ trễ 300ms và tránh phóng to màn hình khi bấm đúp vào nút.

### 1.2 Tương Thích Bàn Phím Ảo & Form Nhập Liệu Trên iPad
- **Khai báo `inputmode` chuẩn**:
  - Nhập số / tiền / mã số: `inputmode="numeric"` hoặc `inputmode="decimal"`
  - Nhập điện thoại: `inputmode="tel"`
  - Nhập email: `inputmode="email"`
- **Tránh bị bàn phím che khuất**:
  - Sử dụng sự kiện `onFocus` kết hợp `scrollIntoView({ behavior: 'smooth', block: 'center' })` cho các ô input ở nửa dưới màn hình.
  - Form trong Modal trên Tablet phải hỗ trợ cuộn nội dung độc lập (`max-h-[80vh] overflow-y-auto`).

### 1.3 Bảng Dữ Liệu Tối Ưu Cho Tablet (Sticky Columns & Smooth Touch Scroll)
```tsx
// src/components/ui/TabletDataTable.tsx
import React from 'react';

export interface Column<T> {
  key: string;
  title: string;
  render?: (record: T) => React.ReactNode;
  width?: string;
  sticky?: 'left' | 'right'; // Cố định cột quan trọng khi vuốt ngang trên iPad
}

interface TabletDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function TabletDataTable<T extends { id: string | number }>({
  columns,
  data,
  loading,
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
}: TabletDataTableProps<T>) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Vùng cuộn cảm ứng mượt mà trên iPad */}
      <div className="overflow-x-auto touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full text-left text-sm text-gray-700 min-w-[700px]">
          <thead className="bg-slate-100 border-b border-gray-200 text-xs font-bold uppercase text-slate-600">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3.5 ${
                    col.sticky === 'right' ? 'sticky right-0 bg-slate-100 shadow-[-2px_0_4px_rgba(0,0,0,0.05)] z-10' : ''
                  }`}
                  style={{ width: col.width }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-4">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                  Không tìm thấy bản ghi nào.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="active:bg-indigo-50/50 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 ${
                        col.sticky === 'right' ? 'sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.05)] z-10' : ''
                      }`}
                    >
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Điều khiển phân trang Touch-friendly: Nút bấm to 44px */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 bg-slate-50 border-t border-gray-200">
        <span className="text-xs text-gray-600 font-medium">
          Hiển thị {(pageIndex - 1) * pageSize + 1} - {Math.min(pageIndex * pageSize, totalCount)} của {totalCount} bản ghi
        </span>
        <div className="flex items-center space-x-2">
          <button
            disabled={pageIndex <= 1 || loading}
            onClick={() => onPageChange(pageIndex - 1)}
            className="min-h-[44px] px-4 py-2 text-sm font-medium border rounded-lg bg-white active:bg-gray-100 disabled:opacity-40 shadow-sm"
          >
            Trang trước
          </button>
          <span className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg">
            {pageIndex} / {totalPages}
          </span>
          <button
            disabled={pageIndex >= totalPages || loading}
            onClick={() => onPageChange(pageIndex + 1)}
            className="min-h-[44px] px-4 py-2 text-sm font-medium border rounded-lg bg-white active:bg-gray-100 disabled:opacity-40 shadow-sm"
          >
            Trang sau
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 1.4 Hỗ Trợ Safe Area & Viewport Cho iPad
Thêm vào `index.html` và global CSS:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```
```css
/* src/index.css */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

---

## 2. Phân Quyền Giao Diện (Client Security UI)

### 2.1 Custom Hook Phân Quyền `usePermission`
```typescript
// src/hooks/usePermission.ts
import { useAuth } from '../contexts/AuthContext';

export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (permissionCode: string): boolean => {
    if (!user || !user.permissions) return false;
    if (user.roles?.includes('SuperAdmin')) return true;
    return user.permissions.includes(permissionCode);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((code) => hasPermission(code));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((code) => hasPermission(code));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
};
```

### 2.2 Component `<HasPermission>` Để Ẩn/Disable Nút Bấm & Menu
```tsx
// src/components/security/HasPermission.tsx
import React from 'react';
import { usePermission } from '../../hooks/usePermission';

interface HasPermissionProps {
  permission: string;
  fallback?: React.ReactNode;
  mode?: 'hide' | 'disable';
  children: React.ReactElement;
}

export const HasPermission: React.FC<HasPermissionProps> = ({
  permission,
  fallback = null,
  mode = 'hide',
  children,
}) => {
  const { hasPermission } = usePermission();
  const allowed = hasPermission(permission);

  if (allowed) {
    return children;
  }

  if (mode === 'disable') {
    return React.cloneElement(children, {
      disabled: true,
      title: 'Bạn không có quyền thực hiện thao tác này',
      style: { ...(children.props.style || {}), opacity: 0.5, cursor: 'not-allowed' },
    });
  }

  return <>{fallback}</>;
};
```

### 2.3 `PrivateRoute` / Guard Component Ngăn Chặn Truy Cập URL Trực Tiếp
```tsx
// src/routes/PrivateRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';

interface PrivateRouteProps {
  requiredPermission?: string;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredPermission }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission } = usePermission();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
```

---

## 3. Tối Ưu Dữ Liệu Lớn & Virtual Scrolling Cho Tablet

Sử dụng `react-window` cho danh sách dài để tránh tràn bộ nhớ RAM của iPad:
```tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualList<T>({ items, height, itemHeight, renderItem }: VirtualListProps<T>) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className="border-b border-gray-100 flex items-center px-4">
      {renderItem(items[index], index)}
    </div>
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

---

## 4. Chuẩn Hóa Design System Cho Màn Hình Cảm Ứng (Touch Design System)

1. **Nút Bấm (Touch Buttons)**:
   - Chiều cao tối thiểu 44px - 48px (`h-11` hoặc `h-12`).
   - Font chữ rõ ràng, dễ đọc (tối thiểu `text-sm` hoặc `text-base` 14px-16px, không dùng font quá nhỏ).
   - Hiệu ứng `active:scale-95` khi ngón tay chạm vào.
2. **Modal / Popup**:
   - Nút đóng (X) to, góc trên phải, kích thước tối thiểu 44x44px.
   - Hỗ trợ đóng khi chạm vào vùng nền (Backdrop click).
3. **Form Inputs**:
   - Chiều cao input tối thiểu 44px, padding ngang 16px.
   - Nhãn (Label) rõ ràng nằm phía trên input (Top-aligned labels) thay vì bên cạnh để tối ưu không gian cả 2 chế độ ngang/dọc của iPad.

---

## 5. Checklist Kiểm Tra Giao Diện Tablet/iPad (Frontend Checklist)

- [ ] **Mọi nút bấm, icon, checkbox có kích thước tối thiểu 44x44px đến 48x48px**.
- [ ] Giao diện hiển thị hoàn hảo ở cả 2 chế độ **Xoay ngang (Landscape)** và **Xoay dọc (Portrait)** trên Tablet/iPad.
- [ ] Các trường nhập liệu có `inputmode` phù hợp (`numeric`, `email`, `tel`).
- [ ] Bàn phím ảo bật lên không che khuất ô nhập liệu hoặc nút bấm Submit.
- [ ] Bảng dữ liệu có thanh cuộn ngang mượt mà trên màn hình cảm ứng và cố định cột Action.
- [ ] Nút bấm/menu có quyền hạn được kiểm soát an toàn bởi `<HasPermission>`.
- [ ] Đầy đủ thư viện trong `package.json` (`react-router-dom`, `axios`, `lucide-react`, `react-window`, `clsx`).
