import { renderHook, act } from "@testing-library/react-hooks"
import { createClient } from "@supabase/supabase-js"
import { useRealtimeOrders } from "../use-realtime-orders"
import { useToast } from "@/components/ui/use-toast"
import { RealtimeChannel } from "@supabase/supabase-js"

// Mock the Supabase client
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  })),
}))

// Mock useToast
jest.mock("@/components/ui/use-toast", () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}))

describe("useRealtimeOrders", () => {
  const MOCK_RESTAURANT_ID = "test-restaurant-id"
  const mockSupabase = createClient() as jest.Mocked<ReturnType<typeof createClient>>
  const mockToast = useToast() as jest.Mocked<ReturnType<typeof useToast>>

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock implementation for each test
    ;(mockSupabase.from as jest.Mock).mockReturnThis()
    ;(mockSupabase.from().select as jest.Mock).mockReturnThis()
    ;(mockSupabase.from().select().eq as jest.Mock).mockReturnThis()
    ;(mockSupabase.from().select().order as jest.Mock).mockResolvedValue({ data: [], error: null })

    // Mock the channel behavior
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    } as unknown as RealtimeChannel
    ;(mockSupabase.channel as jest.Mock).mockReturnValue(mockChannel)
  })

  it("should fetch orders on initial mount", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeOrders(MOCK_RESTAURANT_ID))

    // Expect fetch to be called
    expect(mockSupabase.from).toHaveBeenCalledWith("orders")
    expect(mockSupabase.from().select).toHaveBeenCalled()
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith("restaurant_id", MOCK_RESTAURANT_ID)

    // Wait for the async effect to complete
    await waitForNextUpdate()

    expect(result.current.loading).toBe(false)
    expect(result.current.orders).toEqual([])
  })

  it("should subscribe to real-time changes", () => {
    renderHook(() => useRealtimeOrders(MOCK_RESTAURANT_ID))

    expect(mockSupabase.channel).toHaveBeenCalledWith(`orders-${MOCK_RESTAURANT_ID}`)
    expect(mockSupabase.channel().on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.any(Object), // Payload filter object
      expect.any(Function), // Callback function
    )
    expect(mockSupabase.channel().subscribe).toHaveBeenCalled()
  })

  it("should call refetch on real-time event", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRealtimeOrders(MOCK_RESTAURANT_ID))

    // Wait for initial fetch
    await waitForNextUpdate()

    const onCallback = (mockSupabase.channel().on as jest.Mock).mock.calls[0][2] // Get the real-time event callback

    act(() => {
      onCallback({ eventType: "INSERT", new: {}, old: {} })
    })

    // Expect another fetch to be triggered due to refetchCounter increment
    expect(mockSupabase.from().select().order).toHaveBeenCalledTimes(2) // Initial + 1 for update
  })

  it("should show 'New Order' toast on INSERT event", async () => {
    const { waitForNextUpdate } = renderHook(() => useRealtimeOrders(MOCK_RESTAURANT_ID))
    await waitForNextUpdate()

    const onCallback = (mockSupabase.channel().on as jest.Mock).mock.calls[0][2]
    const newOrder = {
      id: "new-order-id",
      human_readable_id: "ABC1234",
      restaurant_tables: { table_number: "5" },
      status: "Pending",
      payment_status: "PENDING",
    }

    act(() => {
      onCallback({ eventType: "INSERT", new: newOrder, old: null })
    })

    expect(mockToast.toast).toHaveBeenCalledWith({
      title: "🚀 New Order Received!",
      description: `Order #${newOrder.human_readable_id} just placed from Table ${newOrder.restaurant_tables.table_number}.`,
      variant: "default",
    })
  })

  it("should show 'Order Status Updated' toast on status change", async () => {
    const { waitForNextUpdate } = renderHook(() => useRealtimeOrders(MOCK_RESTAURANT_ID))
    await waitForNextUpdate()

    const onCallback = (mockSupabase.channel().on as jest.Mock).mock.calls[0][2]
    const oldOrder = {
      id: "order-id-1",
      human_readable_id: "XYZ7890",
      restaurant_tables: { table_number: "3" },
      status: "Pending",
      payment_status: "PENDING",
    }
    const newOrder = { ...oldOrder, status: "In-Progress" }

    act(() => {
      onCallback({ eventType: "UPDATE", new: newOrder, old: oldOrder })
    })

    expect(mockToast.toast).toHaveBeenCalledWith({
      title: "🔔 Order Status Updated",
      description: `Order #${newOrder.human_readable_id} from Table ${newOrder.restaurant_tables.table_number} is now ${newOrder.status}.`,
      variant: "secondary",
    })
  })

  it("should show 'Order Payment Updated' toast on payment status change", async () => {
    const { waitForNextUpdate } = renderHook(() => useRealtimeOrders(MOCK_RESTAURANT_ID))
    await waitForNextUpdate()

    const onCallback = (mockSupabase.channel().on as jest.Mock).mock.calls[0][2]
    const oldOrder = {
      id: "order-id-2",
      human_readable_id: "LMN4567",
      restaurant_tables: { table_number: "2" },
      status: "Completed",
      payment_status: "PENDING",
    }
    const newOrder = { ...oldOrder, payment_status: "PAID" }

    act(() => {
      onCallback({ eventType: "UPDATE", new: newOrder, old: oldOrder })
    })

    expect(mockToast.toast).toHaveBeenCalledWith({
      title: "💰 Order Payment Updated",
      description: `Order #${newOrder.human_readable_id} from Table ${newOrder.restaurant_tables.table_number} is now ${newOrder.payment_status}.`,
      variant: "secondary",
    })
  })

  it("should not show toast on UPDATE if neither status nor payment_status changes", async () => {
    const { waitForNextUpdate } = renderHook(() => useRealtimeOrders(MOCK_RESTAURANT_ID))
    await waitForNextUpdate()

    const onCallback = (mockSupabase.channel().on as jest.Mock).mock.calls[0][2]
    const oldOrder = {
      id: "order-id-3",
      human_readable_id: "PQR1011",
      restaurant_tables: { table_number: "1" },
      status: "Pending",
      payment_status: "PENDING",
      notes: "old notes",
    }
    const newOrder = { ...oldOrder, notes: "new notes" } // Only notes change

    act(() => {
      onCallback({ eventType: "UPDATE", new: newOrder, old: oldOrder })
    })

    // Expect refetch to be called, but no toast
    expect(mockSupabase.from().select().order).toHaveBeenCalledTimes(2) // Initial + 1 for update
    expect(mockToast.toast).not.toHaveBeenCalled()
  })

  it("should unsubscribe from channel on unmount", async () => {
    const { unmount } = renderHook(() => useRealtimeOrders(MOCK_RESTAURANT_ID))

    expect(mockSupabase.channel().subscribe).toHaveBeenCalled()

    unmount()

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        on: expect.any(Function),
      }),
    )
  })
})
