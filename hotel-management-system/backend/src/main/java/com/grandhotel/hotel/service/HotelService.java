package com.grandhotel.hotel.service;

import com.grandhotel.hotel.dto.Requests;
import com.grandhotel.hotel.exception.ApiException;
import com.grandhotel.hotel.model.Models;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class HotelService {
    private final Map<String, Models.Room> rooms = new ConcurrentHashMap<>();
    private final Map<String, Models.Booking> bookings = new ConcurrentHashMap<>();
    private final Map<String, Models.User> users = new ConcurrentHashMap<>();
    private final Map<String, Models.FoodItem> menu = new ConcurrentHashMap<>();
    private final Map<String, Models.FoodOrder> orders = new ConcurrentHashMap<>();
    private final Map<String, Models.Invoice> invoices = new ConcurrentHashMap<>();
    private final AtomicInteger nextRoomNumber = new AtomicInteger(101);

    public HotelService() {
        seedRooms();
        seedFood();
        users.put("manager@grandhotel.com", new Models.User("USR-1001", "Hotel Manager", "manager@grandhotel.com", "Hotel@123", "MANAGER"));
    }

    private void seedRooms() {
        Map<String, BigDecimal> prices = Map.of("Platinum-AC", bd(5000), "Platinum-Non-AC", bd(4200),
                "Golden-AC", bd(3500), "Golden-Non-AC", bd(2800), "Silver-AC", bd(2200), "Silver-Non-AC", bd(1800));
        for (Map.Entry<String, BigDecimal> entry : prices.entrySet()) {
            String[] parts = entry.getKey().split("-");
            for (int i = 0; i < 3; i++) {
                int number = nextRoomNumber.getAndIncrement();
                String id = "RM-" + number;
                rooms.put(id, new Models.Room(id, number, parts[0], parts[1], entry.getValue(), "AVAILABLE"));
            }
        }
    }

    private void seedFood() {
        addFood("Wok-tossed noodles", "Chinese", "Vegetable noodles with house soy", 420);
        addFood("Crispy chilli paneer", "Chinese", "Crisp paneer, peppers and sesame", 460);
        addFood("Masala dosa", "South Indian", "Fermented rice crepe with potato masala", 280);
        addFood("Idli sambar", "South Indian", "Steamed idli, sambar and chutneys", 220);
        addFood("Paneer makhani", "North Indian", "Paneer in a slow-cooked tomato gravy", 480);
        addFood("Dal tadka", "North Indian", "Yellow lentils tempered with cumin", 340);
        addFood("Garden club sandwich", "Snacks", "Toasted triple-decker with fries", 320);
        addFood("Masala fries", "Snacks", "Crispy fries tossed in house spice", 180);
        addFood("Cold brew", "Beverages", "Slow-steeped coffee over ice", 210);
        addFood("Fresh lime soda", "Beverages", "Sweet or salted, freshly squeezed", 150);
        addFood("Gulab jamun", "Desserts", "Warm syrup-soaked dumplings, two pieces", 190);
        addFood("Baked cheesecake", "Desserts", "Vanilla cheesecake with berry compote", 290);
    }

    private Models.FoodItem addFood(String name, String category, String description, double price) {
        String id = "FD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        Models.FoodItem item = new Models.FoodItem(id, name, category, description, bd(price), true);
        menu.put(id, item);
        return item;
    }

    public synchronized Map<String, Object> login(Requests.Login request) {
        if (request == null || request.email() == null || request.password() == null) throw ApiException.badRequest("Email and password are required.");
        Models.User user = users.get(request.email().trim().toLowerCase(Locale.ROOT));
        if (user == null || !user.password().equals(request.password())) throw new ApiException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
        return Map.of("token", "demo-" + user.id(), "user", user.publicView());
    }

    public synchronized Map<String, Object> signUp(Requests.SignUp request) {
        if (request == null || blank(request.name()) || blank(request.email()) || request.password() == null || request.password().length() < 8)
            throw ApiException.badRequest("Name, email, and a password of at least 8 characters are required.");
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.containsKey(email)) throw ApiException.conflict("An account already exists for this email.");
        Models.User user = new Models.User("USR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT), request.name().trim(), email, request.password(), "STAFF");
        users.put(email, user);
        return Map.of("token", "demo-" + user.id(), "user", user.publicView());
    }

    public List<Models.Room> getRooms() { return rooms.values().stream().sorted((a,b) -> Integer.compare(a.number(), b.number())).toList(); }

    public synchronized Models.Room createRoom(Requests.Room request) {
        if (request == null || blank(request.category()) || blank(request.type()) || request.price() <= 0) throw ApiException.badRequest("Room number, category, type, and a positive price are required.");
        String category = request.category().trim();
        String type = request.type().trim();
        if (!List.of("Platinum", "Golden", "Silver").contains(category) || !List.of("AC", "Non-AC").contains(type)) throw ApiException.badRequest("Choose a valid room category and type.");
        int number = request.number() > 0 ? request.number() : nextRoomNumber.getAndIncrement();
        if (rooms.values().stream().anyMatch(room -> room.number() == number)) throw ApiException.conflict("That room number already exists.");
        String id = "RM-" + number;
        Models.Room room = new Models.Room(id, number, category, type, bd(request.price()), "AVAILABLE");
        rooms.put(id, room);
        return room;
    }

    public synchronized Models.Booking createBooking(Requests.Booking request) {
        if (request == null || blank(request.name()) || blank(request.mobile()) || blank(request.email()) || blank(request.address()) || blank(request.governmentId()) || blank(request.roomId()))
            throw ApiException.badRequest("Complete all guest details and select a room.");
        if (request.guests() < 1 || request.guests() > 12) throw ApiException.badRequest("Guest count must be between 1 and 12.");
        LocalDate checkIn;
        LocalDate checkOut;
        try { checkIn = LocalDate.parse(request.checkIn()); checkOut = LocalDate.parse(request.checkOut()); }
        catch (Exception e) { throw ApiException.badRequest("Enter valid check-in and check-out dates."); }
        if (checkIn.isBefore(LocalDate.now())) throw ApiException.badRequest("Check-in cannot be in the past.");
        if (!checkOut.isAfter(checkIn)) throw ApiException.badRequest("Check-out must be after check-in.");
        Models.Room room = rooms.get(request.roomId());
        if (room == null) throw ApiException.notFound("Room not found.");
        if (room.status().equals("MAINTENANCE") || room.status().equals("CLEANING")) throw ApiException.conflict("This room is not available for booking.");
        boolean overlap = bookings.values().stream().filter(b -> b.roomId().equals(room.id()) && !b.status().equals("CHECKED_OUT"))
                .anyMatch(b -> checkIn.isBefore(b.checkOut()) && checkOut.isAfter(b.checkIn()));
        if (overlap) throw ApiException.conflict("This room is already booked for part of those dates.");
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        Models.Booking booking = new Models.Booking("BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT), request.name().trim(), request.mobile().trim(), request.email().trim(), safe(request.homeTown()), request.address().trim(), request.governmentId().trim(), request.guests(), checkIn, checkOut, nights, room.id(), room.price(), room.price().multiply(BigDecimal.valueOf(nights)), "RESERVED");
        bookings.put(booking.id(), booking);
        syncRoomStatus(room.id());
        return booking;
    }

    public List<Models.Booking> getBookings() { return bookings.values().stream().sorted((a,b) -> b.checkIn().compareTo(a.checkIn())).toList(); }
    public Models.Booking getBooking(String id) { if (blank(id)) throw ApiException.notFound("Booking not found."); Models.Booking booking = bookings.get(id); if (booking == null) throw ApiException.notFound("Booking not found."); return booking; }

    public List<Models.Customer> getCustomers() {
        Map<String, List<Models.Booking>> byEmail = new LinkedHashMap<>();
        bookings.values().forEach(b -> byEmail.computeIfAbsent(b.email().toLowerCase(Locale.ROOT), key -> new ArrayList<>()).add(b));
        return byEmail.values().stream().map(list -> {
            Models.Booking b = list.get(0);
            return new Models.Customer("CU-" + Integer.toHexString(b.email().hashCode()).toUpperCase(Locale.ROOT), b.name(), b.mobile(), b.email(), b.homeTown(), b.address(), b.governmentId(), list.size());
        }).toList();
    }

    public List<Models.FoodItem> getFood() { return menu.values().stream().filter(Models.FoodItem::available).toList(); }
    public synchronized Models.FoodItem createFood(Map<String, Object> request) {
        String name = text(request, "name"); String category = text(request, "category"); String description = text(request, "description");
        if (name.isBlank() || !List.of("Chinese", "South Indian", "North Indian", "Snacks", "Beverages", "Desserts").contains(category)) throw ApiException.badRequest("Provide a name and valid food category.");
        double price = number(request.get("price"));
        if (price <= 0) throw ApiException.badRequest("Food price must be greater than zero.");
        return addFood(name, category, description, price);
    }

    public synchronized Models.FoodOrder addFoodOrder(Requests.FoodOrder request) {
        getBooking(request == null ? null : request.bookingId());
        if (request.items() == null || request.items().isEmpty()) throw ApiException.badRequest("Choose at least one food item.");
        Map<String, Integer> items = new LinkedHashMap<>();
        request.items().forEach((id, quantity) -> { if (!menu.containsKey(id) || quantity == null || quantity < 1 || quantity > 99) throw ApiException.badRequest("Food item or quantity is invalid."); items.put(id, quantity); });
        Models.FoodOrder order = new Models.FoodOrder("FO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT), request.bookingId(), Map.copyOf(items), foodTotal(items), Instant.now());
        orders.put(order.id(), order);
        return order;
    }

    public synchronized Models.FoodOrder updateFoodQuantity(String orderId, String foodId, int quantity) {
        Models.FoodOrder order = orders.get(orderId);
        if (order == null) throw ApiException.notFound("Food order not found.");
        if (!menu.containsKey(foodId) || quantity < 0 || quantity > 99) throw ApiException.badRequest("Food item or quantity is invalid.");
        Map<String, Integer> items = new LinkedHashMap<>(order.items());
        if (quantity == 0) items.remove(foodId); else items.put(foodId, quantity);
        Models.FoodOrder updated = new Models.FoodOrder(order.id(), order.bookingId(), Map.copyOf(items), foodTotal(items), order.createdAt());
        orders.put(orderId, updated);
        return updated;
    }

    public List<Models.FoodOrder> getFoodOrders() { return List.copyOf(orders.values()); }
    public synchronized void deleteFoodOrder(String orderId) { if (orders.remove(orderId) == null) throw ApiException.notFound("Food order not found."); }

    public synchronized Models.Booking checkIn(String id) {
        Models.Booking booking = getBooking(id);
        if (!booking.status().equals("RESERVED")) throw ApiException.conflict("Only reserved bookings can be checked in.");
        Models.Booking updated = booking.withStatus("CHECKED_IN");
        bookings.put(id, updated);
        syncRoomStatus(booking.roomId());
        return updated;
    }

    public synchronized Models.Invoice checkOut(String id, Requests.Checkout request) {
        Models.Booking booking = getBooking(id);
        if (!booking.status().equals("CHECKED_IN")) throw ApiException.conflict("This booking must be checked in before checkout.");
        if (invoices.containsKey(id)) return invoices.get(id);
        BigDecimal services = bd(request == null ? 0 : request.services());
        BigDecimal discount = bd(request == null ? 0 : request.discount());
        if (services.signum() < 0 || discount.signum() < 0) throw ApiException.badRequest("Services and discount cannot be negative.");
        BigDecimal food = orders.values().stream().filter(o -> o.bookingId().equals(id)).map(Models.FoodOrder::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal taxable = booking.totalRoomCharge().add(food).add(services).subtract(discount).max(BigDecimal.ZERO);
        BigDecimal tax = taxable.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = taxable.add(tax).setScale(2, RoundingMode.HALF_UP);
        Models.Invoice invoice = new Models.Invoice("INV-" + id.substring(3), id, booking.name(), booking.roomId(), booking.checkIn(), booking.checkOut(), booking.nights(), booking.totalRoomCharge(), food, services, tax, discount, total, Instant.now());
        invoices.put(id, invoice);
        bookings.put(id, booking.withStatus("CHECKED_OUT"));
        syncRoomStatus(booking.roomId());
        return invoice;
    }

    public Models.Invoice getInvoice(String id) { Models.Invoice invoice = invoices.get(id); if (invoice == null) throw ApiException.notFound("Invoice is not available. Complete checkout first."); return invoice; }

    public Map<String, Object> dashboard() {
        long occupancy = rooms.values().stream().filter(room -> room.status().equals("OCCUPIED")).count();
        BigDecimal revenue = invoices.values().stream().map(Models.Invoice::grandTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("rooms", rooms.size(), "occupiedRooms", occupancy, "availableRooms", rooms.size() - occupancy,
                "activeBookings", bookings.values().stream().filter(b -> b.status().equals("RESERVED") || b.status().equals("CHECKED_IN")).count(),
                "todayArrivals", bookings.values().stream().filter(b -> b.checkIn().equals(LocalDate.now()) && b.status().equals("RESERVED")).count(),
                "todayDepartures", bookings.values().stream().filter(b -> b.checkOut().equals(LocalDate.now()) && b.status().equals("CHECKED_IN")).count(),
                "customers", getCustomers().size(), "revenue", revenue, "recentBookings", getBookings().stream().limit(5).toList());
    }

    private BigDecimal foodTotal(Map<String, Integer> items) {
        return items.entrySet().stream().map(entry -> menu.get(entry.getKey()).price().multiply(BigDecimal.valueOf(entry.getValue()))).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    private void syncRoomStatus(String roomId) {
        Models.Room room = rooms.get(roomId);
        if (room == null || room.status().equals("MAINTENANCE") || room.status().equals("CLEANING")) return;
        String status = bookings.values().stream().filter(booking -> booking.roomId().equals(roomId) && !booking.status().equals("CHECKED_OUT"))
                .anyMatch(booking -> booking.status().equals("CHECKED_IN")) ? "OCCUPIED"
                : bookings.values().stream().anyMatch(booking -> booking.roomId().equals(roomId) && booking.status().equals("RESERVED")) ? "RESERVED" : "AVAILABLE";
        rooms.put(roomId, room.withStatus(status));
    }
    private static BigDecimal bd(double value) { return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP); }
    private static boolean blank(String value) { return value == null || value.isBlank(); }
    private static String safe(String value) { return value == null ? "" : value.trim(); }
    private static String text(Map<String, Object> map, String key) { Object value = map == null ? null : map.get(key); return value == null ? "" : value.toString().trim(); }
    private static double number(Object value) { try { return Double.parseDouble(String.valueOf(value)); } catch (Exception e) { throw ApiException.badRequest("Enter a valid price."); } }
}
